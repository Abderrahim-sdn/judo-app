const CACHE_NAME = 'judo-app-cache-v7';

const urlsToCache = [
  '/',
  '/addParticipant.html',
  '/dashboard.html',
  '/index.html',
  '/login.html',
  '/participantsList.html',

  '/css/style.css',
  '/css/login.css',

  '/js/dashboard.js',
  '/js/install.js',
  '/js/login.js',
  '/js/participants.js',
  '/js/script.js',

  '/manifest.json',
  '/sw-register.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', event => {

  const url = new URL(event.request.url);

  // NEVER intercept Firebase / Google API requests
  if (
    url.hostname === 'firestore.googleapis.com' ||
    url.hostname === 'firebase.googleapis.com' ||
    url.hostname.endsWith('.googleapis.com')
  ) {
    return;
  }

  // HTML → network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // JavaScript → network first
  if (event.request.destination === 'script') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Other files → cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});