
/**
 * Service Worker for Native Desktop Notifications
 * Handles background notifications even when the main tab is inactive,
 * minimized, or when the user is browsing on another tab.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  const targetUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url && client.url.includes(self.location.origin)) {
          const navPromise = ('navigate' in client) ? client.navigate(targetUrl) : Promise.resolve();
          return navPromise.then(() => {
            if ('focus' in client) {
              return client.focus();
            }
          });
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
