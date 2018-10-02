var CACHE_NAME = 'LiveappCache-5_9';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function() {
            return self.skipWaiting();
          })
    );
});

self.addEventListener('activate', function (event) {

    var cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function(){
            return clients.claim()
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.match(event.request).then(function(response) {
                // Cache hit - return response
                if (response && response.ok) {
                    console.log('Im Cached!');
                    return response;
                }
                return fetch(event.request).then(function(response) {
                    if(event.request.method === "GET" && response.ok)
                      cache.put(event.request, response.clone());
                    return response;
                });
            });
        })
    );
});