import { useEffect, useState } from "react";
import { connectRealtime } from "./services/realtime";
import { Sidebar } from "./components/layout/Sidebar/Sidebar";
import { ScreenOverlay } from "./components/overlay/ScreenOverlay/ScreenOverlay";
import { LoginModal } from "./components/auth/LoginModal/LoginModal";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { HOME_SCREEN, SCREENS } from "./navigation/screens";
import type { ScreenId } from "./navigation/screens";
import styles from "./App.module.css";

const AUTH_KEY = "aaop-authed";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenId>(HOME_SCREEN);
  // Access gate: persisted for the browser session so a refresh doesn't force
  // re-login until the tab/session is closed (or Log Out is pressed).
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === "true",
  );

  // Open the realtime (SSE) connection once signed in, for the app's lifetime.
  useEffect(() => {
    if (!authed) return;
    return connectRealtime();
  }, [authed]);

  const handleLoginSuccess = () => {
    sessionStorage.setItem(AUTH_KEY, "true");
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setActiveScreen(HOME_SCREEN);
    setAuthed(false);
  };

  const handleSelect = (id: ScreenId) => {
    setActiveScreen(id);
    setSidebarOpen(false); // close the mobile drawer on navigation
  };

  const current = SCREENS[activeScreen];
  const isOverlayOpen = activeScreen !== HOME_SCREEN;
  const OverlayContent = current.overlay;

  return (
    <>
      {/* While signed out, the whole app is inert (non-interactive, unfocusable)
          behind the blocking login modal. */}
      <div className={styles.shell} inert={!authed}>
        <Sidebar
          isOpen={sidebarOpen}
          activeScreen={activeScreen}
          onSelect={handleSelect}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
        {sidebarOpen && (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className={styles.main}>
          <Dashboard onMenuClick={() => setSidebarOpen(true)} />
        </main>

        {isOverlayOpen && (
          <ScreenOverlay
            title={current.label}
            onClose={() => setActiveScreen(HOME_SCREEN)}
          >
            {OverlayContent && <OverlayContent />}
          </ScreenOverlay>
        )}
      </div>

      {!authed && <LoginModal onSuccess={handleLoginSuccess} />}
    </>
  );
}
