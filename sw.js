
// TeamBot: Script de Auto-Destruição de Cache
// Este script força a remoção do Service Worker antigo para que o usuário receba a atualização do design.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url);
          }
        });
        console.log('TeamBot: Service Worker antigo destruído com sucesso.');
      })
  );
});
