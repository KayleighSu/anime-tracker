// service-worker.js

const CACHE_NAME = "anime-tracker-v2"; // increment version when you update
const assets = [
  "/",                    // root
  "/Tracker.html",
  "/Tracker.css",
  "/Tracker.js",
  "/notes.html",
  "/notes.txt",
  
];

// Install event: cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

// Activate event: clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
});

// Fetch event: respond with cache first, then network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

