import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import ErrorPage from "./error-page";
import "./index.css";
import AuthLayout from "./routes/auth/auth-layout";
import LoginPage from "./routes/auth/login";
import SignUpPage from "./routes/auth/sign-up";
import LandingPage from "./routes/Landing";
import Accounts from "./routes/protected/accounts";
import Beneficiaries from "./routes/protected/beneficiaries";
import Cards from "./routes/protected/cards";
import Dashboard from "./routes/protected/dashboard";
import HomeLayoutPage from "./routes/protected/home-layout";
import Profile from "./routes/protected/profile";
import Settings from "./routes/protected/settings";
import Transactions from "./routes/protected/transactions";
import Upi from "./routes/protected/upi";
import { Toaster as ToastProvider } from './components/ui/toaster';
import Transfers from './routes/protected/transfers';

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "auth",
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "signup",
        element: <SignUpPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: "/",
    element: <HomeLayoutPage />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/beneficiaries",
        element: <Beneficiaries />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/accounts",
        element: <Accounts />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/transactions",
        element: <Transactions />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/transfers",
        element: <Transfers />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/upi",
        element: <Upi />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/cards",
        element: <Cards />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/profile",
        element: <Profile />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/settings",
        element: <Settings />,
        errorElement: <ErrorPage />,
      },
    ],
  },
]);

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
        <ToastProvider />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
