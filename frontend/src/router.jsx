import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import AppShell from "@/components/shell/AppShell";
import Dashboard from "@/pages/Dashboard";
import JobDescription from "@/pages/JobDescription";
import Resumes from "@/pages/Resumes";
import Processing from "@/pages/Processing";
import Ranked from "@/pages/Ranked";
import CandidateDetail from "@/pages/CandidateDetail";
import InterviewPrep from "@/pages/InterviewPrep";
import EmailDraft from "@/pages/EmailDraft";
import InterviewSummary from "@/pages/InterviewSummary";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Profile from "@/pages/Profile";
import ContactUs from "@/pages/ContactUs";
import Clients from "@/pages/Clients";
import Internal from "@/pages/Internal";
import { ROUTE_PATTERNS } from "@/lib/routes";
import { useAuth } from "@/lib/auth";

// Brief full-screen spinner shown while a stored token is validated on load.
function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div
        className="h-[46px] w-[46px] animate-spin-slow rounded-full border-4 border-accent-soft"
        style={{ borderTopColor: "#6366f1" }}
      />
    </div>
  );
}

// Gate for the app shell — bounce to register (the entry route) when signed out.
function RequireAuth() {
  const { isAuthed, loading } = useAuth();
  if (loading) return <AuthLoading />;
  return isAuthed ? <Outlet /> : <Navigate to="/register" replace />;
}

// Centered auth layout — bounce into the app if already signed in.
function AuthLayout() {
  const { isAuthed, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (isAuthed) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-bg">
      <Outlet />
    </div>
  );
}

// Wrap a page element in the shell, passing the screen key for
// breadcrumb + sidebar active state.
const withShell = (screen, element) => ({
  element: <AppShell screen={screen} />,
  children: [{ index: true, element }],
});

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/register", element: <Register /> },
      { path: "/login", element: <Login /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: ROUTE_PATTERNS.dashboard, ...withShell("dashboard", <Dashboard />) },
      { path: ROUTE_PATTERNS.jd, ...withShell("jd", <JobDescription />) },
      { path: ROUTE_PATTERNS.resumes, ...withShell("resumes", <Resumes />) },
      { path: ROUTE_PATTERNS.processing, ...withShell("processing", <Processing />) },
      { path: ROUTE_PATTERNS.ranked, ...withShell("ranked", <Ranked />) },
      { path: ROUTE_PATTERNS.candidate, ...withShell("candidate", <CandidateDetail />) },
      { path: ROUTE_PATTERNS.prep, ...withShell("prep", <InterviewPrep />) },
      { path: ROUTE_PATTERNS.email, ...withShell("email", <EmailDraft />) },
      { path: ROUTE_PATTERNS.summary, ...withShell("summary", <InterviewSummary />) },
      { path: ROUTE_PATTERNS.profile, ...withShell("profile", <Profile />) },
      { path: ROUTE_PATTERNS.contact, ...withShell("contact", <ContactUs />) },
      { path: ROUTE_PATTERNS.clients, ...withShell("clients", <Clients />) },
      { path: ROUTE_PATTERNS.internal, ...withShell("internal", <Internal />) },
    ],
  },
  // Unknown URL → send to the dashboard (or, if signed out, RequireAuth
  // bounces on to /register) instead of react-router's bare error screen.
  { path: "*", element: <Navigate to="/" replace /> },
]);
