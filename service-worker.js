const CACHE_NAME = 'judo-app-cache-v1';

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
  '/js/manifest.js',
  '/js/participants.js',
  '/js/script.js',
  '/js/sw-register.js',

  // Firebase
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js',

  // Charts
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
