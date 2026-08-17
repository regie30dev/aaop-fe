import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { login } from "../../../services/auth";
import { getErrorMessage } from "../../../utils/errors";
import { Spinner } from "../../common/Spinner/Spinner";
import opLogo from "../../../assets/op-logo.png";
import styles from "./LoginModal.module.css";

interface LoginModalProps {
  /** Called once credentials are accepted by the backend. */
  onSuccess: () => void;
}

/**
 * Full-screen, blocking sign-in gate. Renders over everything (portal to
 * <body>) with a dimmed/blurred backdrop, so the app behind it is inert until
 * a valid username/password is entered. Stays put on failure with an inline
 * error; dismisses (via onSuccess) only on a successful login.
 */
export function LoginModal({ onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userRef = useRef<HTMLInputElement>(null);

  // Lock background scroll and focus the username field on mount.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    userRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, "Sign in failed. Please try again."));
      setPassword("");
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className={styles.backdrop}>
      <form
        className={styles.card}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <div className={styles.brand}>
          <img className={styles.logo} src={opLogo} alt="Office of the President" />
          <h1 id="login-title" className={styles.title}>
            OP Assets
          </h1>
          <p className={styles.subtitle}>Sign in to continue</p>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Username</span>
          <span className={styles.inputWrap}>
            <User size={16} className={styles.inputIcon} aria-hidden="true" />
            <input
              ref={userRef}
              className={styles.input}
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              disabled={submitting}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <span className={styles.inputWrap}>
            <Lock size={16} className={styles.inputIcon} aria-hidden="true" />
            <input
              className={styles.input}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              disabled={submitting}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.reveal}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        {error && (
          <p className={styles.error} role="alert">
            <AlertCircle size={15} />
            {error}
          </p>
        )}

        <button className={styles.submit} type="submit" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>,
    document.body,
  );
}
