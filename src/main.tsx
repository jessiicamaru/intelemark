import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import CloudinaryScript from './components/CloudinaryScript';

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
    <>
        <CloudinaryScript />
        <RouterProvider router={router} />
    </>
    // </StrictMode>
);
