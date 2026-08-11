/**
 * Chart colors for recharts. Recharts reads raw color strings on its `fill`/
 * `stroke`/gradient props and cannot resolve CSS custom properties, so these
 * literals must be kept in sync by hand with the `--color-*` tokens in
 * `src/index.css`. Centralized here so there is a single place to update.
 */
export const chartColors = {
  primary: "#2563eb", // --color-primary
  accentRed: "#dc2626", // --color-accent-red
};
