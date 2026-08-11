import { useEffect, useState } from "react";
import { connectRealtime } from "./services/realtime";
import { Sidebar } from "./components/layout/Sidebar/Sidebar";
import { ScreenOverlay } from "./components/overlay/ScreenOverlay/ScreenOverlay";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { HOME_SCREEN, SCREENS } from "./navigation/screens";
import type { ScreenId } from "./navigation/screens";
import styles from "./App.module.css";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenId>(HOME_SCREEN);

  // Open the realtime (SSE) connection for the app's lifetime.
  useEffect(() => connectRealtime(), []);

  const handleSelect = (id: ScreenId) => {
    setActiveScreen(id);
    setSidebarOpen(false); // close the mobile drawer on navigation
  };

  const current = SCREENS[activeScreen];
  const isOverlayOpen = activeScreen !== HOME_SCREEN;
  const OverlayContent = current.overlay;

  return (
    <div className={styles.shell}>
      <Sidebar
        isOpen={sidebarOpen}
        activeScreen={activeScreen}
        onSelect={handleSelect}
        onClose={() => setSidebarOpen(false)}
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
  );
}
