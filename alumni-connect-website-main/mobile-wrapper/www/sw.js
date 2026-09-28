// Alumnex Connect — Web Push & Streak Service Worker
const CACHE_NAME = 'alumnex-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for incoming Web Push events from server
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Alumnex Connect', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || '🔥 Alumnex Notification';
  const targetUrl = data.url || data.deepLink || '/activity';

  const options = {
    body: data.body || 'You have a new update in Alumnex Connect.',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || (data.type ? `alumnex-${data.type.toLowerCase()}` : 'alumnex-notification'),
    renotify: true,
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
    data: {
      url: targetUrl,
      type: data.type,
      id: data.id || data._id
    },
    actions: data.actions || [
      { action: 'open', title: 'Open Alumnex' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler: opens or focuses the Alumnex application and routes
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/activity';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Support local message trigger from the web application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_STREAK_NOTIFICATION') {
    const { title, body, url } = event.data;
    self.registration.showNotification(title || '🔥 Streak At Risk: 3 Hours Left!', {
      body: body || 'You have less than 3 hours remaining today to complete your daily activity and protect your streak.',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'streak-at-risk',
      renotify: true,
      requireInteraction: true,
      data: { url: url || '/activity' }
    });
  }
});
