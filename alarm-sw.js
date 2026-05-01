// Service Worker for persistent alarm notifications and audio playback

let audio = null;

// Listen for messages from the main page
self.addEventListener('message', async event => {
  const data = event.data;
  if (data.type === 'START_ALARM') {
    // Load audio file (relative to origin)
    audio = new Audio('/assets/alarm.mp3');
    audio.loop = true;
    try {
      await audio.play();
    } catch (err) {
      console.warn('Audio play failed (may require user interaction):', err);
    }

    // Show notification with action to stop
    self.registration.showNotification('⏰ Hora de acordar!', {
      body: 'Clique para parar o alarme.',
      icon: '/assets/alarm-icon.png',
      vibrate: [200, 100, 200],
      actions: [{ action: 'stop', title: 'Parar' }],
      tag: 'aura-alarm',
      renotify: true
    });
  } else if (data.type === 'STOP_ALARM') {
    if (audio) {
      audio.pause();
      audio = null;
    }
    // Close any active alarm notification
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(n => {
        if (n.tag === 'aura-alarm') n.close();
      });
    });
  }
});

// Handle notification clicks (including action buttons)
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'stop' || notification.tag === 'aura-alarm') {
    // Stop the alarm
    if (audio) {
      audio.pause();
      audio = null;
    }
    notification.close();
  } else {
    // If the user clicks the notification body, open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if (client.url === location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
  // Ensure notification is closed
  notification.close();
});

// Optionally handle push events (not used here, but placeholder)
self.addEventListener('push', event => {
  // If we ever want to support push notifications
  const options = {
    body: event.data ? event.data.text() : 'Push received',
    icon: '/assets/alarm-icon.png',
    vibrate: [100, 50, 100]
  };
  event.waitUntil(self.registration.showNotification('Aura', options));
});
