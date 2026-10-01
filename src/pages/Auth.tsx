import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faUser,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../context/AuthContext";

type AuthMode = "signin" | "signup";

function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not complete that request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = () => {
    setMode(isSignUp ? "signin" : "signup");
    setErrorMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand-icon">
          <FontAwesomeIcon icon={faWallet} />
        </div>

        <p className="auth-eyebrow">Budget Planner</p>
        <h1 id="auth-title">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="auth-description">
          {isSignUp
            ? "Set up an account to keep your budget organized."
            : "Sign in to continue to your budget."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="auth-field">
              <label htmlFor="authName">Full name</label>
              <div className="auth-input-wrapper">
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                <input
                  id="authName"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="authEmail">Email address</label>
            <div className="auth-input-wrapper">
              <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
              <input
                id="authEmail"
                name="username"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="authPassword">Password</label>
            <div className="auth-input-wrapper">
              <FontAwesomeIcon icon={faLock} aria-hidden="true" />
              <input
                id="authPassword"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignUp ? "At least 8 characters" : "Your password"}
                minLength={isSignUp ? 8 : undefined}
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="auth-field">
              <label htmlFor="authConfirmPassword">Confirm password</label>
              <div className="auth-input-wrapper">
                <FontAwesomeIcon icon={faLock} aria-hidden="true" />
                <input
                  id="authConfirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  minLength={8}
                  required
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="auth-error" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className="auth-submit-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Please wait..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="auth-switch-prompt">
          {isSignUp ? "Already have an account?" : "New to Budget Planner?"}
          <button type="button" onClick={changeMode}>
            {isSignUp ? "Sign in" : "Create account"}
          </button>
        </p>

        <p className="auth-local-notice">
          Accounts and budgets are stored only in this browser. They do not
          sync between devices.
        </p>
      </section>
    </main>
  );
}

export default Auth;