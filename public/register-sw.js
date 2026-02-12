
// Service Worker Registration
// This file registers the service worker for PWA functionality

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Try both sw.js and service-worker.js (Workbox generates sw.js)
    const swUrls = ['/sw.js', '/service-worker.js'];
    
    let registered = false;
    
    swUrls.forEach(swUrl => {
      if (!registered) {
        navigator.serviceWorker
          .register(swUrl)
          .then(registration => {
            console.log('✅ Service Worker registered:', swUrl);
            registered = true;
            
            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New version available! Refresh to update.');
                  
                  // Optionally show a notification to the user
                  if (window.confirm('A new version is available. Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            });
          })
          .catch(error => {
            console.warn(`⚠️ Service Worker registration failed for ${swUrl}:`, error);
          });
      }
    });
  });
  
  // Handle service worker messages
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('📦 Cache updated:', event.data.url);
    }
  });
  
  // Handle controller change (new service worker activated)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker controller changed');
  });
} else {
  console.warn('⚠️ Service Workers are not supported in this browser');
}
