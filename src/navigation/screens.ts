import type { ComponentType } from "react";
import {
  Building2,
  Home,
  LayoutDashboard,
  UserRound,
  Wrench,
} from "lucide-react";
import { EmployeeScreen } from "../components/employee/EmployeeScreen/EmployeeScreen";

export type ScreenId =
  | "dashboard"
  | "accountability"
  | "property"
  | "employee"
  | "department";

export interface ScreenConfig {
  id: ScreenId;
  label: string;
  icon: ComponentType<{ size?: number }>;
  /** When present, the screen opens as an overlay rendering this component.
   *  When absent, the overlay opens blank (title only). */
  overlay?: ComponentType;
}

/** The home screen, rendered as the main content (not an overlay). */
export const HOME_SCREEN: ScreenId = "dashboard";

/** Single source of truth for navigation + routing. Labels are presentation
 *  only; routing keys off the typed `ScreenId`, so a label change can never
 *  silently break the screen mapping. */
export const SCREENS: Record<ScreenId, ScreenConfig> = {
  dashboard: { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  accountability: {
    id: "accountability",
    label: "Accountability",
    icon: Wrench,
  },
  property: { id: "property", label: "Property", icon: Home },
  employee: {
    id: "employee",
    label: "Employee",
    icon: UserRound,
    overlay: EmployeeScreen,
  },
  department: { id: "department", label: "Office", icon: Building2 },
};

/** Display order in the sidebar. */
export const SCREEN_ORDER: ScreenId[] = [
  "dashboard",
  "accountability",
  "property",
  "employee",
  "department",
];
