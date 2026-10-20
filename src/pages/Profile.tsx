import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faCoins,
  faBell,
  faMoon,
  faRightFromBracket,
  faFloppyDisk,
  faCircleCheck,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { signOut } = useAuth();
  const {
    profile,
    updateProfile,
    saveProfile,
    syncError,
  } = useProfile();

  const [name, setName] = useState(
    profile.name
  );

  const [email, setEmail] = useState(
    profile.email
  );

  const [currency, setCurrency] =
    useState(profile.currency);

  const [monthlyBudget, setMonthlyBudget] =
    useState("0");

  const [saveMessage, setSaveMessage] =
    useState("");
  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    setSaveError("");
    updateProfile({
      name: name.trim() || "User",
      email: email.trim() || "user@example.com",
      currency,
    });

    try {
      await saveProfile();
      setSaveMessage("Your profile has been saved successfully.");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save your profile to Supabase."
      );
    }

    window.setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await signOut();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not sign out."
      );
    }
  };

  return (
    <div className="profile-page">

      {/* ================================
          HEADER
      ================================= */}

      <header className="page-header">

        <p className="eyebrow">
          Account settings
        </p>

        <h1>
          Profile
        </h1>

        <p>
          Manage your personal preferences
          and budget settings.
        </p>

      </header>

      {/* ================================
          PROFILE CARD
      ================================= */}

      <section className="profile-card">

        <div className="profile-avatar">
          <FontAwesomeIcon
            icon={faUser}
          />
        </div>

        <div className="profile-card-info">

          <h2>
            {name || "Your Name"}
          </h2>

          <p>
            {email || "your@email.com"}
          </p>

        </div>

      </section>

      {/* ================================
          PERSONAL INFORMATION
      ================================= */}

      <section className="profile-settings-card">

        <div className="profile-section-heading">

          <div className="profile-section-icon">
            <FontAwesomeIcon
              icon={faUser}
            />
          </div>

          <div>
            <h2>
              Personal Information
            </h2>

            <p>
              Update your basic profile details.
            </p>
          </div>

        </div>

        <div className="profile-form">

          {/* Name */}

          <div className="profile-input-group">

            <label htmlFor="profileName">
              Full Name
            </label>

            <div className="profile-input-wrapper">

              <FontAwesomeIcon
                icon={faUser}
              />

              <input
                id="profileName"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
              />

            </div>

          </div>

          {/* Email */}

          <div className="profile-input-group">

            <label htmlFor="profileEmail">
              Email Address
            </label>

            <div className="profile-input-wrapper">

              <FontAwesomeIcon
                icon={faEnvelope}
              />

              <input
                id="profileEmail"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
              />

            </div>

          </div>

        </div>

      </section>

      {/* ================================
          BUDGET PREFERENCES
      ================================= */}

      <section className="profile-settings-card">

        <div className="profile-section-heading">

          <div className="profile-section-icon">
            <FontAwesomeIcon
              icon={faWallet}
            />
          </div>

          <div>
            <h2>
              Budget Preferences
            </h2>

            <p>
              Customize how your budget is
              displayed.
            </p>
          </div>

        </div>

        <div className="profile-form">

          {/* Currency */}

          <div className="profile-input-group">

            <label htmlFor="currency">
              Currency
            </label>

            <div className="profile-input-wrapper">

              <FontAwesomeIcon
                icon={faCoins}
              />

              <select
                id="currency"
                value={currency}
                onChange={(event) =>
                  setCurrency(
                    event.target.value
                  )
                }
              >
                <option value="ZAR">
                  South African Rand (R)
                </option>

                <option value="USD">
                  US Dollar ($)
                </option>

                <option value="GBP">
                  British Pound (£)
                </option>

                <option value="EUR">
                  Euro (€)
                </option>
              </select>

            </div>

          </div>

          {/* Monthly Budget */}

          <div className="profile-input-group">

            <label htmlFor="monthlyBudget">
              Monthly Budget Preference
            </label>

            <div className="profile-input-wrapper">

              <FontAwesomeIcon
                icon={faWallet}
              />

              <input
                id="monthlyBudget"
                type="number"
                min="0"
                step="0.01"
                value={monthlyBudget}
                onChange={(event) =>
                  setMonthlyBudget(
                    event.target.value
                  )
                }
                placeholder="0.00"
              />

            </div>

          </div>

        </div>

      </section>

      {/* ================================
          NOTIFICATIONS
      ================================= */}

      <section className="profile-settings-card">

        <div className="profile-setting-row">

          <div className="profile-setting-content">

            <div className="profile-setting-icon">
              <FontAwesomeIcon
                icon={faBell}
              />
            </div>

            <div>

              <h3>
                Notifications
              </h3>

              <p>
                Receive reminders and budget
                updates.
              </p>

            </div>

          </div>

          <button
            type="button"
            className={`toggle ${
              profile.notifications
                ? "active"
                : ""
            }`}
            onClick={() =>
              updateProfile({
                notifications:
                  !profile.notifications,
              })
            }
            aria-label="Toggle notifications"
          >
            <span />
          </button>

        </div>

      </section>

      {/* ================================
          DARK MODE
      ================================= */}

      <section className="profile-settings-card">

        <div className="profile-setting-row">

          <div className="profile-setting-content">

            <div className="profile-setting-icon">
              <FontAwesomeIcon
                icon={faMoon}
              />
            </div>

            <div>

              <h3>
                Dark Mode
              </h3>

              <p>
                Use a darker appearance for the
                app.
              </p>

            </div>

          </div>

          <button
            type="button"
            className={`toggle ${
              profile.darkMode
                ? "active"
                : ""
            }`}
            onClick={() =>
              updateProfile({
                darkMode:
                  !profile.darkMode,
              })
            }
            aria-label={
              profile.darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            aria-pressed={profile.darkMode}
          >
            <span />
          </button>

        </div>

      </section>

      {/* ================================
          SAVE BUTTON
      ================================= */}

      <button
        className="profile-save-button"
        onClick={handleSave}
      >
        <FontAwesomeIcon
          icon={faFloppyDisk}
        />

        Save Profile
      </button>

      {saveMessage && (
        <div
          className="profile-save-message"
          role="status"
        >
          <FontAwesomeIcon
            icon={faCircleCheck}
          />

          <span>
            {saveMessage}
          </span>
        </div>
      )}

      {(saveError || syncError) && (
        <p className="auth-error" role="alert">
          {saveError || `Supabase sync failed: ${syncError}`}
        </p>
      )}

      {/* ================================
          LOGOUT
      ================================= */}

      <button
        className="logout-button"
        onClick={handleLogout}
      >
        <FontAwesomeIcon
          icon={faRightFromBracket}
        />

        Sign Out
      </button>

    </div>
  );
}

export default Profile;