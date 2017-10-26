var CACHE_NAME = 'LiveappCache-V%PARAM:INSTANCEVERSION%';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(
                [
                    '%SERVERADDRESS%%PARAM:INSTANCE%?mobile=true',
                    '%SERVERADDRESS%f/?t=css&mobile=true&ver=%VERSION%&instance=%PARAM:INSTANCE%&includecustom=true',
                    '%SERVERADDRESS%f/?t=js&mobile=true&ver=%VERSION%&instance=%PARAM:INSTANCE%&min=%PARAM:MINIFY%&includecustom=true'
                ]
            );
        }).then(function() {
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
    //console.log(event.request);
    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
            // Cache hit - return response
            if (response) {
                console.log('Im Cached!');
                return response;
            }
            return fetch(event.request);
        }
        )
    );
});