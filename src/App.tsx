import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import BudgetPlanner from "./pages/BudgetPlanner";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";
import { useAuth } from "./context/AuthContext";
import { UserDataProvider, useUserData } from "./context/UserDataContext";
import { supabaseConfigError } from "./lib/supabase";

function PlannerApp() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "budget":
        return <BudgetPlanner />;

      case "profile":
        return <Profile />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <main className="main-content">
        {renderPage()}
      </main>

      <Footer />

      <BottomNav
        activePage={activePage}
        onNavigate={setActivePage}
      />
    </div>
  );
}

function AuthenticatedApp() {
  const { status, loadError, retryLoad } = useUserData();

  if (status === "loading") {
    return (
      <main className="auth-screen" role="status">
        Loading your Supabase data...
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <h1>Could not load your data</h1>
          <p className="auth-error" role="alert">{loadError}</p>
          <button
            className="auth-submit-button"
            type="button"
            onClick={retryLoad}
          >
            Try again
          </button>
        </section>
        <Footer />
      </main>
    );
  }

  return <PlannerApp />;
}

function App() {
  const { user, isLoading, error, recoveryMode } = useAuth();

  if (supabaseConfigError) {
    return (
      <main className="auth-screen">
        <section className="auth-panel" aria-labelledby="config-error-title">
          <h1 id="config-error-title">App configuration required</h1>
          <p className="auth-error" role="alert">
            {supabaseConfigError}
          </p>
          <p className="auth-description">
            In your hosting dashboard, add the Supabase project URL and
            publishable key as build environment variables. Keep secret and
            service-role keys out of the browser app.
          </p>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="auth-screen" role="status">
        Connecting to Supabase...
      </main>
    );
  }

  if (recoveryMode) {
    return (
      <div className="auth-layout">
        <Auth recoveryMode />
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-layout">
        <Auth />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <Footer />
      </div>
    );
  }

  return (
    <UserDataProvider key={user.id} user={user}>
      <AuthenticatedApp />
    </UserDataProvider>
  );
}

export default App;