import getRouterBasename from '@/lib/router';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import AuthCallback from 'pages/AuthCallback';
import Element from 'pages/Element';
import Env from 'pages/Env';
import Home from 'pages/Home';
import Login from 'pages/Login';
import MainLayout from 'pages/MainLayout';
import Thread from 'pages/Thread';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(
  [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'thread/:id?', element: <Thread /> },
        { path: 'share/:id', element: <Thread /> }
      ]
    },
    {
      path: '/env',
      element: <Env />
    },
    {
      path: '/element/:id',
      element: <Element />
    },
    {
      path: '/login',
      element: <Login />
    },
    {
      path: '/login/callback',
      element: <AuthCallback />
    },
    {
      path: '*',
      element: <Navigate replace to="/" />
    }
  ],
  { basename: getRouterBasename() }
);
