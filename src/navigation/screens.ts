import type { ComponentType } from "react";
import {
  Building2,
  Home,
  LayoutDashboard,
  UserRound,
  Wrench,
} from "lucide-react";
import { EmployeeScreen } from "../components/employee/EmployeeScreen/EmployeeScreen";
import { OfficeScreen } from "../components/office/OfficeScreen/OfficeScreen";
import { PropertyScreen } from "../components/property/PropertyScreen/PropertyScreen";
import { AccountabilityScreen } from "../components/accountability/AccountabilityScreen/AccountabilityScreen";

export type ScreenId =
  | "dashboard"
  | "accountability"
  | "property"
  | "employee"
  | "office";

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
    overlay: AccountabilityScreen,
  },
  property: {
    id: "property",
    label: "Property",
    icon: Home,
    overlay: PropertyScreen,
  },
  employee: {
    id: "employee",
    label: "Employee",
    icon: UserRound,
    overlay: EmployeeScreen,
  },
  office: {
    id: "office",
    label: "Office",
    icon: Building2,
    overlay: OfficeScreen,
  },
};

/** Display order in the sidebar. */
export const SCREEN_ORDER: ScreenId[] = [
  "dashboard",
  "accountability",
  "property",
  "employee",
  "office",
];
