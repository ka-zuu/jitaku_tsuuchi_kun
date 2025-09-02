self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('Push event has no data or data is not JSON', e);
    data = { title: 'Error', body: 'Could not parse notification data.' };
  }

  const title = data.title || 'Notification';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: 'icon-192x192.png', // Optional
    badge: 'icon-192x192.png' // Optional
    // Actions will be added later for Sesame
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  // Logic for notification click action will be added here.
});
