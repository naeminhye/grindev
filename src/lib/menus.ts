export type AppMenu = {
  href: string;
  labelKey: string; // i18n key
  icon: string;
};

export const APP_MENUS: AppMenu[] = [
  { href: "/today", labelKey: "nav.today", icon: "ri-code-s-slash-line" },
  { href: "/history", labelKey: "nav.history", icon: "ri-history-line" },
  { href: "/profile", labelKey: "nav.profile", icon: "ri-bar-chart-box-line" },
  { href: "/shop", labelKey: "nav.shop", icon: "ri-store-2-line" },
  { href: "/settings", labelKey: "nav.settings", icon: "ri-settings-3-line" },
];
