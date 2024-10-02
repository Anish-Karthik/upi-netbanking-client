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
import HomeLayoutPage from "./routes/protected/home-layout";
import Dashboard from "./routes/protected/dashboard";
import Accounts from "./routes/protected/accounts";
import Transactions from "./routes/protected/transactions";
import Upi from "./routes/protected/upi";
import Cards from "./routes/protected/cards";
import Settings from "./routes/protected/settings";
import Profile from "./routes/protected/profile";
import Beneficiaries from "./routes/protected/beneficiaries";

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  </StrictMode>
);
