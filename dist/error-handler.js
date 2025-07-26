// Error handling for the Chrome extension popup
(function() {
    // Add error handling
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = '<div class="error">Error loading extension: ' + e.error.message + '</div>';
        }
    });
    
    // Add unhandled promise rejection handling
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = '<div class="error">Promise error: ' + e.reason + '</div>';
        }
    });
})(); 