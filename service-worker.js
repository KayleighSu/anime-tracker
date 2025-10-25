const cacheName = "anime-tracker-v1";
const assets = [
    "/",
    "/index.html",
    "/Tracker.css",
    "/Tracker.js",
    "/images/",
    "notes.txt",
    "notes.html",
    
];

self.addEventListener("install", event => {
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(assets);
        })
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );

});
