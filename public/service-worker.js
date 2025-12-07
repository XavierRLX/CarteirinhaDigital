// public/service-worker.js

const CACHE_NAME = 'upa-carteirinha-v1';

const OFFLINE_URLS = [
  '/',
  '/login',
  '/carteirinhaDigital',
  '/cadastroPublico',

  // CSS principal
  '/style/styleCD.css',

  // JS principais (ajuste se tiver mais)
  '/javaScript/dadosUser.js',
  '/javaScript/formatacao.js',
  '/javaScript/modalCarteirinha.js',
  '/javaScript/verificaLocal.js',
  '/javaScript/ui.js',

  // Ícones
  '/imgs/icon-192.png',
  '/imgs/icon-512.png'
];

// Instala e faz cache básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estratégia simples: 
// - só intercepta GET
// - ignora chamadas pra /api
// - tenta cache primeiro, depois rede
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api')) {
    // deixa API seguir normal
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).catch(() => {
        // em erro de rede, tenta voltar pra homepage
        if (url.pathname === '/' || url.pathname === '/login') {
          return caches.match('/login');
        }
        return caches.match('/');
      });
    })
  );
});
