
import Layout from '@/components/layout/layout';
import Panel from '@/components/shared/Panel';
import DoctorPanel from '@/pages/DoctorPanel';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import Notification from '@/pages/Notification';
import PatientPanel from '@/pages/PatientPanel';
import Profile from '@/pages/Profile';
import Setting from '@/pages/Setting';
import SignUp from '@/pages/SignUp';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <SignUp />,
      },
      {
        path: 'doctor',
        element: <DoctorPanel />,
      },
      {
        path: 'patient',
        element: <PatientPanel />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'panel',
        element: <Panel />,
      },
      {
        path: 'notifications',
        element: <Notification />,
      },
      {
        path: 'settings',
        element: <Setting />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
