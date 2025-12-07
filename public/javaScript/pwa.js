// public/javaScript/pwa.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('Service Worker registrado:', reg.scope);
      })
      .catch((err) => {
        console.error('Erro ao registrar Service Worker:', err);
      });
  });
}
