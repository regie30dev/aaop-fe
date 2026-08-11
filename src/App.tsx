import { useState } from "react";
import { EmployeeScreen } from "./components/employee/EmployeeScreen/EmployeeScreen";
import { Sidebar } from "./components/layout/Sidebar/Sidebar";
import { ScreenOverlay } from "./components/overlay/ScreenOverlay/ScreenOverlay";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import styles from "./App.module.css";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState("Dashboard");

  const handleSelect = (label: string) => {
    setActiveScreen(label);
    setSidebarOpen(false); // close the mobile drawer on navigation
  };

  const isOverlayOpen = activeScreen !== "Dashboard";

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
          title={activeScreen}
          onClose={() => setActiveScreen("Dashboard")}
        >
          {activeScreen === "Employee" && <EmployeeScreen />}
        </ScreenOverlay>
      )}
    </div>
  );
}
