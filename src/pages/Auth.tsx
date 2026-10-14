import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faUser,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../context/AuthContext";

type AuthMode = "signin" | "signup" | "forgot";

interface AuthProps {
  recoveryMode?: boolean;
}

function Auth({ recoveryMode = false }: AuthProps) {
  const {
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    finishPasswordRecovery,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "signup";
  const isForgotPassword = mode === "forgot";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if ((isSignUp || recoveryMode) && password !== confirmPassword) {
      setErrorMessage("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (recoveryMode) {
        await updatePassword(password);
        setPasswordUpdated(true);
        return;
      }

      if (isForgotPassword) {
        await requestPasswordReset(email);
        setSuccessMessage(
          "If an account exists for this email, a password reset link will be sent."
        );
        return;
      }

      if (isSignUp) {
        const isSignedIn = await signUp(name, email, password);

        if (!isSignedIn) {
          setSuccessMessage(
            "Account created. Check your email to confirm your address. The confirmation link will return you to the app."
          );
        }
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

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  if (passwordUpdated) {
    return (
      <main className="auth-screen">
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-brand-icon">
            <FontAwesomeIcon icon={faWallet} />
          </div>
          <p className="auth-eyebrow">Budget Planner</p>
          <h1 id="auth-title">Password updated</h1>
          <p className="auth-description">
            Your password has been changed. Continue to your budget.
          </p>
          <button
            className="auth-submit-button"
            type="button"
            onClick={finishPasswordRecovery}
          >
            Continue
          </button>
        </section>
      </main>
    );
  }

  const title = recoveryMode
    ? "Choose a new password"
    : isForgotPassword
      ? "Reset your password"
      : isSignUp
        ? "Create your account"
        : "Welcome back";

  const description = recoveryMode
    ? "Enter a new password for your account."
    : isForgotPassword
      ? "We will email you a secure password reset link."
      : isSignUp
        ? "Set up an account to keep your budget organized."
        : "Sign in to continue to your budget.";

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand-icon">
          <FontAwesomeIcon icon={faWallet} />
        </div>

        <p className="auth-eyebrow">Budget Planner</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-description">{description}</p>

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

          {!recoveryMode && (
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
          )}

          {!isForgotPassword && (
            <div className="auth-field">
              <label htmlFor="authPassword">
                {recoveryMode ? "New password" : "Password"}
              </label>
              <div className="auth-input-wrapper">
                <FontAwesomeIcon icon={faLock} aria-hidden="true" />
                <input
                  id="authPassword"
                  name="password"
                  type="password"
                  autoComplete={
                    isSignUp || recoveryMode
                      ? "new-password"
                      : "current-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    isSignUp || recoveryMode
                      ? "At least 8 characters"
                      : "Your password"
                  }
                  minLength={isSignUp || recoveryMode ? 8 : undefined}
                  required
                />
              </div>
            </div>
          )}

          {(isSignUp || recoveryMode) && (
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

          {successMessage && (
            <p className="auth-local-notice" role="status">
              {successMessage}
            </p>
          )}

          <button
            className="auth-submit-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Please wait..."
              : recoveryMode
                ? "Update password"
                : isForgotPassword
                  ? "Send reset link"
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
          </button>
        </form>

        {!recoveryMode && (
          <>
            {mode === "signin" && (
              <p className="auth-switch-prompt">
                <button type="button" onClick={() => changeMode("forgot")}>
                  Forgot your password?
                </button>
              </p>
            )}

            <p className="auth-switch-prompt">
              {isForgotPassword
                ? "Remembered your password?"
                : isSignUp
                  ? "Already have an account?"
                  : "New to Budget Planner?"}
              <button
                type="button"
                onClick={() =>
                  changeMode(isSignUp || isForgotPassword ? "signin" : "signup")
                }
              >
                {isSignUp || isForgotPassword ? "Sign in" : "Create account"}
              </button>
            </p>

            <p className="auth-local-notice">
              Your account, budget and profile are securely synced with
              Supabase.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default Auth;
