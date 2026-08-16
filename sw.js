/* Offline kunnen vastleggen. Netwerk eerst, cache als vangnet. */
var CACHE = "vangnet-v6";
var KERN = ["./", "./index.html", "./manifest.webmanifest",
            "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(KERN); }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (namen) {
    return Promise.all(namen.filter(function (n) { return n !== CACHE; })
                            .map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var u = new URL(e.request.url);
  if (u.origin !== location.origin) return;   // AI-verzoeken nooit onderscheppen
  e.respondWith(
    fetch(e.request).then(function (r) {
      var kopie = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, kopie); });
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (t) {
        return t || caches.match("./index.html");
      });
    })
  );
});
