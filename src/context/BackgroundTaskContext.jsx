import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companies, profile as profileApi } from '../api/endpoints';
import {
  sendBrowserNotification,
  requestNotificationPermission,
  createUnthrottledTimer,
  isProfileGenerationComplete,
} from '../utils/notifications';
import { useToast } from './AppContext';

const BackgroundTaskContext = createContext(null);

export function BackgroundTaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const { toast, error: toastError } = useToast();
  const navigate = useNavigate();

  // Keep ref to navigate so callbacks can use it
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const updateTask = useCallback((taskId, updates) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  }, []);

  const removeTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const runCompanyCreation = useCallback(
    async ({
      companyName,
      website,
      country,
      logoUrl,
      logoBase64,
      founders = [],
      files = [],
      onProgress,
    }) => {
      const taskId = `company-create-${Date.now()}`;
      const taskObj = {
        id: taskId,
        type: 'company_creation',
        companyName,
        status: 'creating', // 'creating' | 'uploading' | 'onboarding' | 'completed' | 'error'
        stepMessage: 'Registering company workspace…',
        startedAt: Date.now(),
        notified: false,
      };

      setTasks((prev) => [...prev, taskObj]);

      const notifyStep = (status, stepMessage) => {
        updateTask(taskId, { status, stepMessage });
        if (onProgress) onProgress(status, stepMessage);
      };

      try {
        /* Step 1: create the company */
        notifyStep('creating', 'Registering company and founders…');
        const res = await companies.create({ name: companyName.trim() });
        const companyId = res?.id || res?.companyId;
        if (!companyId) throw new Error('Company was created but no ID was returned.');

        updateTask(taskId, { companyId });

        /* Step 2: upload documents if any */
        if (files && files.length > 0) {
          notifyStep('uploading', `Uploading ${files.length} document(s)…`);
          for (const item of files) {
            try {
              const fd = new FormData();
              fd.append('file', item.file);
              fd.append('category', item.category);
              await profileApi.uploadDocument(companyId, fd);
            } catch (ex) {
              console.warn(`File upload skipped for ${item.file?.name}:`, ex);
            }
          }
        }

        /* Step 3: onboard with collected metadata & AI synthesis */
        notifyStep('onboarding', 'Silk AI is synthesizing company profile…');
        const url = website?.trim()
          ? website.trim().startsWith('http')
            ? website.trim()
            : `https://${website.trim()}`
          : undefined;

        await profileApi.onboard(companyId, {
          ...(url ? { websiteUrl: url } : {}),
          ...(country ? { hqCountry: country } : {}),
          ...(logoUrl && !logoBase64 ? { logoUrl } : {}),
          ...(logoBase64 ? { logoBase64 } : {}),
          founders: founders
            .filter((f) => f.name?.trim() || f.linkedinUrl?.trim())
            .map((f) => ({
              name: f.name.trim(),
              linkedinUrl: f.linkedinUrl?.trim() || '',
              isFullTime: !!f.isFullTime,
              selfConfirmed: !!f.selfConfirmed,
            })),
        });

        // Completed successfully!
        updateTask(taskId, {
          status: 'completed',
          stepMessage: 'Company workspace ready!',
          completedAt: Date.now(),
        });

        // Trigger native desktop notification
        sendBrowserNotification(`Workspace Ready: ${companyName}`, {
          body: `AI profile generation complete for "${companyName}". Click to open.`,
          onClickUrl: `/companies/${companyId}/profile`,
          onNavigate: (path) => navigateRef.current(path),
        });

        toast(`🎉 "${companyName}" workspace is ready!`);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('company-created', { detail: { companyId } }));
        }

        return { success: true, companyId };
      } catch (err) {
        console.error('Failed to create company:', err);
        const errMsg = err?.detail || err?.message || 'Failed to complete company setup';
        updateTask(taskId, {
          status: 'error',
          stepMessage: errMsg,
          error: errMsg,
        });

        sendBrowserNotification(`Error creating ${companyName}`, {
          body: errMsg,
        });
        toastError(errMsg);

        throw err;
      }
    },
    [updateTask, toast, toastError]
  );

  // Map of actively running timer cleanup functions keyed by companyId
  const timersByCompanyRef = useRef(new Map());

  const watchCompanyGeneration = useCallback(
    ({ companyId, companyName }) => {
      if (!companyId) return;

      // Stop any existing timer for this company to prevent duplicates
      if (timersByCompanyRef.current.has(companyId)) {
        try { timersByCompanyRef.current.get(companyId)(); } catch (_) { }
      }

      const taskId = `company-gen-${companyId}`;
      const cName = companyName || 'Company';

      // Persist in localStorage so page navigation/reload never loses the background watch
      try {
        localStorage.setItem(`silk_watch_${companyId}`, JSON.stringify({ companyId, companyName: cName, time: Date.now() }));
      } catch (_) { }

      setTasks((prev) => [
        ...prev.filter((t) => t.id !== taskId),
        {
          id: taskId,
          type: 'company_generation',
          companyId,
          companyName: cName,
          status: 'generating',
          stepMessage: 'Silk AI is synthesizing company profile…',
          startedAt: Date.now(),
        },
      ]);

      let finished = false;
      let stopTimer = null;

      const checkStatus = async () => {
        if (finished) return;
        try {
          const res = await profileApi.read(companyId);
          console.log(`[Silk Watcher] Polled ${companyId}:`, res?.status, res);

          const isError = res?.status === 'failed' || res?.status === 'error';
          if (isError) {
            finished = true;
            timersByCompanyRef.current.delete(companyId);
            try { localStorage.removeItem(`silk_watch_${companyId}`); } catch (_) { }
            if (stopTimer) stopTimer();

            updateTask(taskId, {
              status: 'error',
              stepMessage: 'Profile generation failed',
            });
            sendBrowserNotification(`Profile Generation Failed: ${cName}`, {
              body: `Could not complete profile generation for "${cName}".`,
            });
            return;
          }

          if (isProfileGenerationComplete(res)) {
            finished = true;
            timersByCompanyRef.current.delete(companyId);
            try { localStorage.removeItem(`silk_watch_${companyId}`); } catch (_) { }
            if (stopTimer) stopTimer();

            updateTask(taskId, {
              status: 'completed',
              stepMessage: 'Company workspace ready!',
              completedAt: Date.now(),
            });

            const finalName = res?.companyName || res?.name || res?.company_name || cName;

            await sendBrowserNotification(`Workspace Ready: ${finalName}`, {
              body: `AI profile generation complete for "${finalName}". Click to open.`,
              onClickUrl: `/companies/${companyId}/profile`,
              tag: `silk-company-${companyId}`,
              onNavigate: (path) => navigateRef.current(path),
            });

            toast(`🎉 "${finalName}" workspace is ready!`);

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('company-created', { detail: { companyId } }));
            }
          }
        } catch (err) {
          console.warn(`Background watcher check for ${companyId}:`, err);
        }
      };

      stopTimer = createUnthrottledTimer(checkStatus, 3000);
      timersByCompanyRef.current.set(companyId, stopTimer);

      // Immediately run an initial poll check
      checkStatus();

      // Safeguard: auto-stop timer after 15 minutes
      setTimeout(() => {
        if (!finished) {
          finished = true;
          timersByCompanyRef.current.delete(companyId);
          try { localStorage.removeItem(`silk_watch_${companyId}`); } catch (_) { }
          if (stopTimer) stopTimer();
        }
      }, 15 * 60 * 1000);
    },
    [updateTask, toast]
  );

  // Resume any active generation watchers stored in localStorage on mount
  useEffect(() => {
    try {
      const now = Date.now();
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      for (const key of keys) {
        if (key && key.startsWith('silk_watch_')) {
          const item = JSON.parse(localStorage.getItem(key));
          if (item && item.companyId && (now - (item.time || 0) < 15 * 60 * 1000)) {
            watchCompanyGeneration({ companyId: item.companyId, companyName: item.companyName });
          } else {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (_) { }
  }, [watchCompanyGeneration]);

  return (
    <BackgroundTaskContext.Provider
      value={{
        tasks,
        runCompanyCreation,
        watchCompanyGeneration,
        removeTask,
        requestNotificationPermission,
      }}
    >
      {children}
    </BackgroundTaskContext.Provider>
  );
}

export const useBackgroundTasks = () => useContext(BackgroundTaskContext);

