import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faCalculator,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        className={activePage === "dashboard" ? "active" : ""}
        onClick={() => onNavigate("dashboard")}
      >
        <FontAwesomeIcon icon={faChartPie} />
        <span>Dashboard</span>
      </button>

      <button
        className={activePage === "budget" ? "active" : ""}
        onClick={() => onNavigate("budget")}
      >
        <FontAwesomeIcon icon={faCalculator} />
        <span>Budget Planner</span>
      </button>

      <button
        className={activePage === "profile" ? "active" : ""}
        onClick={() => onNavigate("profile")}
      >
        <FontAwesomeIcon icon={faUser} />
        <span>Profile</span>
      </button>
    </nav>
  );
}

export default BottomNav;