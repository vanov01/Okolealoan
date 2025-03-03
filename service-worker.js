const CACHE_NAME = 'okolea-cache-v1'; // Update version when you make changes
const urlsToCache = [
  '/', // Cache the main page
  '/index.html',
  '/application.html',
  '/confirm.html',
  '/summary.html',
  '/style.css',
  '/images/icon-192x192.png', // Replace with your icon paths
  '/images/icon-512x512.png'
  // Add other assets you want to cache
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
      .then(response => {
        if (response) {
          return response; // Return from cache if available
        }
        return fetch(event.request); // Otherwise, fetch from network
      })
  );
});
