import '../styles/globals.css'
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Prevent multiple interceptions
    if (window.fetch.hasOwnProperty('_isIntercepted')) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Check if the response is 401 Unauthorized
      // We skip /auth/login to allow the login component to handle its own errors
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      if (response.status === 401 && !url.includes('/auth/login')) {
        console.warn('Unauthorized request detected, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to home/login by reloading the page
        // The Home component will see there is no token and show the login screen
        window.location.reload();
      }

      return response;
    };

    window.fetch._isIntercepted = true;
  }, []);

  return <Component {...pageProps} />
}

export default MyApp
