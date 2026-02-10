const CACHE_NAME = 'judo-app-cache-v3';

const urlsToCache = [
  '/',
  '/addParticipant.html',
  '/dashboard.html',
  '/index.html',
  '/login.html',
  '/participantsList.html',

  // CSS
  '/css/style.css',
  '/css/login.css',

  // JS
  '/js/dashboard.js',
  '/js/install.js', 
  '/js/login.js', 
  '/js/participants.js',
  '/js/script.js',
  '/manifest.json',
  '/sw-register.js',

  // Firebase
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js',

  // Charts
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // activate new SW immediately

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim(); // take control of open pages
});


self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    // Always try network first for pages
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
  } else {
    // Cache first for static files
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});