/**
 * Edge-safe page routes configuration (no React imports).
 * Used by Next.js Middleware (Edge Runtime) for route-level access control.
 * Must remain a plain JS/TS module with no client-side or React dependencies.
 */

export interface PageRouteConfig {
  key: string;
  href: string;
  additionalPrefixes?: string[];
}

/**
 * Page routes that require page_routes access control.
 * Change Password (/admin/settings) is intentionally excluded — always accessible.
 */
export const PAGE_ROUTES_CONFIG: PageRouteConfig[] = [
  { key: "dashboard",         href: "/admin/dashboard"                                       },
  { key: "families",          href: "/admin/families", additionalPrefixes: ["/admin/family"] },
  { key: "attendance",        href: "/admin/attendance"                                      },
  { key: "offerings",         href: "/admin/offerings"                                       },
  { key: "accounts",          href: "/admin/accounts"                                        },
  { key: "new_commers",       href: "/admin/new-commers"                                     },
  { key: "admin_management",  href: "/admin/admin-management"                                },
  { key: "dropdown_settings", href: "/admin/dropdown-settings"                               },
  { key: "feature_settings",  href: "/admin/feature-settings"                                },
];

/**
 * Helper to match any incoming admin pathname to its configured PageRoute
 */
export function findMatchedPageRoute(pathname: string): PageRouteConfig | undefined {
  return PAGE_ROUTES_CONFIG.find(
    (p) =>
      pathname.startsWith(p.href) ||
      (p.additionalPrefixes && p.additionalPrefixes.some((prefix) => pathname.startsWith(prefix)))
  );
}

/**
 * Pages always accessible regardless of page_routes (personal account actions).
 */
export const ALWAYS_ACCESSIBLE_PATHS = [
  "/admin/settings",
  "/admin/change-password",
];

