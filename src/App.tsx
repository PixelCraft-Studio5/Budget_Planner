import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import BudgetPlanner from "./pages/BudgetPlanner";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";
import { useAuth } from "./context/AuthContext";
import { BudgetProvider } from "./context/BudgetContext";
import { ProfileProvider } from "./context/ProfileContext";

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

function App() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="auth-layout">
        <Auth />
        <Footer />
      </div>
    );
  }

  return (
    <ProfileProvider key={user.email}>
      <BudgetProvider>
        <PlannerApp />
      </BudgetProvider>
    </ProfileProvider>
  );
}

export default App;