import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { GeneratingStep, getStepStatus } from './ProfileHelpers';
import { useBackgroundTasks } from '../../context/BackgroundTaskContext';
import { useToast } from '../../context/AppContext';
import { requestNotificationPermission } from '../../utils/notifications';

/**
 * GeneratingDialog — Full-screen modal shown while the backend is
 * generating the company profile via the AI pipeline.
 * Features a "Notify me" button that enables desktop notifications
 * and hides itself after clicking. The modal stays open until
 * generation is complete (status changes from generating/draft).
 */
export default function GeneratingDialog({ data, companyId: propCompanyId, companyName: propCompanyName }) {
  const params = useParams();
  const { toast } = useToast();
  const { watchCompanyGeneration } = useBackgroundTasks();

  const [permissionState, setPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // Track whether user has clicked "Notify me" — hides the button but keeps modal open
  const [notifyClicked, setNotifyClicked] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Modal stays open while generating/draft, closes automatically when complete
  const isOpen = data?.status === 'generating' || data?.status === 'draft';
  const companyId = propCompanyId || params.companyId || data?.id || data?.companyId;
  const companyName = propCompanyName || data?.name || data?.companyName || data?.company_name || 'Company';


  async function handleNotifyMe() {
    const granted = await requestNotificationPermission();
    if (typeof Notification !== 'undefined') {
      setPermissionState(Notification.permission);
    }

    if (watchCompanyGeneration && companyId) {
      watchCompanyGeneration({
        companyId,
        companyName,
      });
    }

    if (granted || (typeof Notification !== 'undefined' && Notification.permission === 'granted')) {
      toast(`You'll receive a desktop notification when "${companyName}" is ready.`);
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      toast.error(`⚠️ Desktop notifications are blocked in browser settings. Click the lock icon in your address bar to allow.`);
    } else {
      toast(`Generating "${companyName}" in background.`);
    }

    // Hide the Notify me button, but keep modal open
    setNotifyClicked(true);
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[450px]"
        style={{ background: '#fff', color: '#000', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        showCloseButton={false}
      >
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ padding: 8, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <DialogTitle style={{ fontSize: 20, color: 'black', margin: 0 }}>Generating company profile…</DialogTitle>
          </div>
          <DialogDescription style={{ color: '#6b7280', fontSize: 14, marginTop: 0 }}>
            We're building a comprehensive profile from your website, uploaded documents, and public sources. This may take a few minutes.
          </DialogDescription>
        </DialogHeader>

        <div style={{ marginTop: 20 }}>
          <GeneratingStep
            label="Google search in progress"
            detail="Researching company across 10 topic areas"
            status={getStepStatus(data, 'research')}
          />
          <GeneratingStep
            label="Extracting uploaded documents"
            detail="Converting PDF, PPTX, Excel with OCR where needed"
            status={getStepStatus(data, 'documents')}
          />
          <GeneratingStep
            label="Consolidating evidence"
            detail="Merging web research with document data"
            status={getStepStatus(data, 'consolidating')}
          />
          <GeneratingStep
            label="Synthesizing company profile"
            detail="AI generating structured 17-section profile"
            status={getStepStatus(data, 'synthesizing')}
          />
          <GeneratingStep
            label="Saving profile"
            detail="Finalizing and storing results"
            status={getStepStatus(data, 'saving')}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12.5, color: '#4b5563' }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #ccc', borderTopColor: 'black', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <span>This page will update automatically when ready</span>
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!notifyClicked ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>Want a notification when ready?</span>
                <button
                  type="button"
                  className="acm-notify-btn"
                  onClick={handleNotifyMe}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Notify me
                </button>
              </div>

              {permissionState === 'denied' && (
                <div style={{ fontSize: 11.5, color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: 6, border: '1px solid #fecaca', lineHeight: 1.3 }}>
                  ⚠️ Desktop notifications are blocked in your browser. Click the lock/tune icon next to the URL to enable notifications.
                </div>
              )}

              <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0, lineHeight: 1.4 }}>
                Get a desktop notification and chime when the profile is ready. You can freely switch tabs while waiting.
              </p>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, color: '#15803d' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>You'll be notified when the profile is ready. Feel free to switch tabs!</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
