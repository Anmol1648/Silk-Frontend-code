/**
 * Web Notifications, ServiceWorker & Sound Alert Helper
 * Provides cross-browser support for requesting notification permissions,
 * dispatching native system notifications via ServiceWorker (for background tabs),
 * audio chimes, and tab title flashing.
 */

// Auto-register ServiceWorker to enable background notifications in Chrome
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('Service worker registration failed:', err);
  });
}

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request desktop notification permissions from the browser.
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    console.warn('Browser notifications are not supported on this device/browser.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notifications are currently denied in browser site settings.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    return new Promise((resolve) => {
      try {
        Notification.requestPermission((p) => resolve(p === 'granted'));
      } catch {
        resolve(false);
      }
    });
  }
}

/**
 * Synthesizes a clean, pleasant two-tone completion chime using Web Audio API.
 * Works without loading any external sound files.
 */
export function playNotificationSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      try { ctx.resume(); } catch (_) {}
    }
    const now = ctx.currentTime;

    // Tone 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: B5 (987.77Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}

let titleFlashTimer = null;
/**
 * Flashes the browser tab title back and forth so background tabs grab attention.
 */
export function flashTabTitle(alertText, durationMs = 15000) {
  if (typeof document === 'undefined') return;
  if (titleFlashTimer) clearInterval(titleFlashTimer);

  const originalTitle = document.title;
  let isOriginal = false;

  titleFlashTimer = setInterval(() => {
    document.title = isOriginal ? originalTitle : alertText;
    isOriginal = !isOriginal;
  }, 1000);

  const stopFlashing = () => {
    if (titleFlashTimer) {
      clearInterval(titleFlashTimer);
      titleFlashTimer = null;
      document.title = originalTitle;
    }
    window.removeEventListener('focus', stopFlashing);
    window.removeEventListener('click', stopFlashing);
  };

  window.addEventListener('focus', stopFlashing);
  window.addEventListener('click', stopFlashing);

  setTimeout(stopFlashing, durationMs);
}

/**
 * Determines whether a company profile generation pipeline is complete.
 * Checks for status === 'generated' (or completed / ready / done).
 */
export function isProfileGenerationComplete(res) {
  if (!res) return false;

  const rawStatus = res.status;
  const status = String(rawStatus || '').toLowerCase().trim();

  // In-progress or draft indicators
  if (['generating', 'processing', 'pending', 'in_progress', 'initiating', 'drafting', 'draft'].includes(status)) {
    return false;
  }

  // Check specifically for 'generated' status
  if (status === 'generated' || ['completed', 'ready', 'done'].includes(status)) {
    return true;
  }

  return false;
}

/**
 * Creates a robust background timer that survives tab switching.
 * Combines:
 * 1. Web Worker interval (unthrottled by Chrome background tabs)
 * 2. Standard setInterval fallback/dual-timer
 * 3. Page visibility change & focus listener (triggers immediate poll when tab wakes)
 */
export function createUnthrottledTimer(callback, intervalMs) {
  let isStopped = false;
  let lastRun = 0;

  const trigger = () => {
    if (isStopped) return;
    const now = Date.now();
    // Debounce to prevent rapid overlapping triggers within 1.5s
    if (now - lastRun < Math.max(1500, intervalMs * 0.6)) return;
    lastRun = now;
    try {
      callback();
    } catch (err) {
      console.warn('Timer callback error:', err);
    }
  };

  // 1. Standard setInterval
  const intervalId = setInterval(trigger, intervalMs);

  // 2. Web Worker interval
  let worker = null;
  try {
    const workerCode = `
      var t = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          t = setInterval(function() { self.postMessage('tick'); }, ${intervalMs});
        } else if (e.data === 'stop') {
          if (t) clearInterval(t);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    worker = new Worker(workerUrl);
    worker.onmessage = () => trigger();
    worker.onerror = (err) => {
      console.warn('Web Worker background timer error, falling back to setInterval:', err);
    };
    worker.postMessage('start');
  } catch (ex) {
    console.warn('Could not initialize Web Worker timer, falling back to standard timer:', ex);
  }

  // 3. Visibility and focus triggers
  const onVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      trigger();
    }
  };
  const onFocus = () => trigger();

  if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
  }

  return () => {
    isStopped = true;
    if (intervalId) clearInterval(intervalId);
    if (worker) {
      try {
        worker.postMessage('stop');
        worker.terminate();
      } catch (_) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    }
  };
}

/**
 * Dispatch a native system notification (using ServiceWorker if available, so it displays
 * even when the tab is in the background), and trigger sound & tab title flash.
 */
export async function sendBrowserNotification(title, options = {}) {
  // Always play chime & flash tab title
  playNotificationSound();
  flashTabTitle(`🔔 ${title}`);

  if (!isNotificationSupported()) {
    console.warn('Notification API not supported.');
    return null;
  }

  if (Notification.permission === 'default') {
    try {
      await requestNotificationPermission();
    } catch (_) {}
  }

  if (Notification.permission !== 'granted') {
    console.warn(`Desktop notification skipped: permission is "${Notification.permission}"`);
    return null;
  }

  try {
    const { onClickUrl, onNavigate, icon, badge, tag, ...restOptions } = options;

    // Use full absolute URL to a valid PNG raster image (Windows Action Center rejects SVGs)
    const iconUrl = icon || (typeof window !== 'undefined'
      ? new URL('/brand/silk-logo.png', window.location.origin).href
      : '/brand/silk-logo.png');

    const notificationOptions = {
      icon: iconUrl,
      badge: iconUrl,
      data: { url: onClickUrl },
      tag: tag || `silk-alert-${Date.now()}`,
      renotify: true,
      requireInteraction: true, // Keep notification pinned on Windows until clicked!
      silent: false,
      ...restOptions,
    };

    // 1. Try ServiceWorker showNotification first (Works across background tabs!)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        let reg = null;
        try {
          reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 600)),
          ]);
        } catch (_) {}

        if (!reg) {
          reg = await navigator.serviceWorker.getRegistration();
        }

        if (reg && reg.showNotification) {
          await reg.showNotification(title, notificationOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('Service worker showNotification fallback:', swErr);
      }
    }

    // 2. Fallback to standard new Notification
    const notification = new Notification(title, notificationOptions);

    notification.onclick = function (event) {
      event.preventDefault();
      try {
        window.focus();
      } catch (_) {}

      if (onClickUrl) {
        if (typeof onNavigate === 'function') {
          onNavigate(onClickUrl);
        } else {
          window.location.href = onClickUrl;
        }
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('Failed to trigger native browser notification:', err);
    return null;
  }
}
