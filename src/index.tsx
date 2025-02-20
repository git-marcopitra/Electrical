import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { UserContextProvider, useUserContext } from './context/User/UserContext';
import { ToastContextProvider } from './context/Toast/ToastContext';
import App from './App';
import './style/globalStyle.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { CartContextProvider } from './context/Cart/CartContext';
import { LoaderContextProvider } from './context/Loader/LoaderContext';

const UserAuth = () => {
  const { dispath } = useUserContext();
  useEffect(() => {
    const auth = getAuth();
    const sub = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispath({ type: 'LOG_IN', payload: user });
      }
    });
    return sub;
  }, [dispath]);

  return <div>Loading...</div>;
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <UserContextProvider>
    <ToastContextProvider>
        <CartContextProvider>
          <LoaderContextProvider>
            <UserAuth />
            <React.StrictMode>
              <App />
            </React.StrictMode>
          </LoaderContextProvider>
        </CartContextProvider>
    </ToastContextProvider>
  </UserContextProvider>
);
