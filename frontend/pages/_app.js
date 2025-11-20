import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Suppress MetaMask errors if extension is installed
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('MetaMask') || args[0]?.message?.includes?.('MetaMask')) {
        return; // Ignore MetaMask errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
          loading: {
            style: {
              background: '#3B82F6',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#3B82F6',
            },
          },
        }}
      />
    </>
  );
}

export default MyApp;
