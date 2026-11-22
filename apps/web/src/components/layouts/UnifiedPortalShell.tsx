import { ChevronDownIcon, LogOutIcon, MenuIcon, StethoscopeIcon, XIcon } from "lucide-react";
import React, { createContext, useContext, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { applyDocumentDirection } from "@/i18n/config";
import { useTheme } from "@/lib/compat/theme";
import { useAuth } from "@/stores/authStore";
import { pdMotion } from "@/lib/motion";
import { PortalTopbar } from "./PortalTopbar";

export interface PortalSubmenuItem {
  to: string;
  label: string;
}

export interface PortalNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  submenu?: PortalSubmenuItem[];
}

export interface UnifiedPortalShellProps {
  portalTitle: string;
  portalBadge: string;
  navItems: PortalNavItem[];
  children: React.ReactNode;
}

const PortalShellContext = createContext(false);

function SidebarNavItem({
  item,
  isOpen,
  isCollapsed,
  onToggle,
  onNavigate,
}: {
  item: PortalNavItem;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const isSubActive = Boolean(item.submenu?.some((s) => pathname === s.to));
  const isActive = pathname === item.to || isSubActive;

  if (!item.submenu || item.submenu.length === 0) {
    return (
      <li>
        <NavLink
          to={item.to}
          onClick={onNavigate}
          aria-label={isCollapsed ? item.label : undefined}
          title={isCollapsed ? item.label : undefined}
          className={({ isActive: linkActive }) =>
            `group relative flex h-11 items-center rounded-[var(--shape-control)] text-sm font-medium transition-colors ${
              isCollapsed ? "justify-center px-0" : "gap-3 px-3.5"
            } ${
              linkActive
                ? "bg-[var(--pd-acid-soft)] text-[var(--pd-acid)]"
                : "text-[var(--pd-text-secondary)] hover:bg-[var(--pd-surface)] hover:text-[var(--pd-text-primary)]"
            }`
          }
        >
          {({ isActive: linkActive }) => (
            <>
              {linkActive && !isCollapsed && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-[var(--pd-acid)]"
                />
              )}
              <span className="shrink-0 text-base transition-transform duration-150 group-hover:scale-105">
                {item.icon}
              </span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </>
          )}
        </NavLink>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-current={isActive ? "page" : undefined}
        aria-label={isCollapsed ? item.label : undefined}
        title={isCollapsed ? item.label : undefined}
        onClick={onToggle}
        className={`flex h-11 w-full items-center rounded-[var(--shape-control)] text-sm font-medium transition-colors ${
          isCollapsed ? "justify-center px-0" : "gap-3 px-3.5"
        } ${
          isOpen || isActive
            ? "bg-[var(--pd-acid-soft)] text-[var(--pd-acid)]"
            : "text-[var(--pd-text-secondary)] hover:bg-[var(--pd-surface)] hover:text-[var(--pd-text-primary)]"
        }`}
      >
        <span className="shrink-0 text-base">{item.icon}</span>
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate text-start">{item.label}</span>
            <ChevronDownIcon
              size={15}
              strokeWidth={1.7}
              className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen && !isCollapsed ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <ul className="grid gap-0.5 overflow-hidden py-1">
          {item.submenu.map((sub) => (
            <li key={sub.to}>
              <NavLink
                to={sub.to}
                onClick={onNavigate}
                className={({ isActive: subActive }) =>
                  `relative flex h-9 items-center rounded-[var(--shape-control)] ps-10 pe-3 text-xs font-medium transition-colors before:absolute before:start-5 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full ${
                    subActive
                      ? "bg-[var(--pd-surface)] text-[var(--pd-acid)] before:bg-[var(--pd-acid)]"
                      : "text-[var(--pd-text-muted)] before:bg-[var(--pd-line-strong)] hover:bg-[var(--pd-surface)]/60 hover:text-[var(--pd-text-primary)]"
                  }`
                }
              >
                {sub.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function UnifiedPortalShell({
  portalTitle,
  portalBadge,
  navItems,
  children,
}: UnifiedPortalShellProps) {
  const isInsideShell = useContext(PortalShellContext);
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [collapsed, setCollapsed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleLocale = () => {
    const next = isAr ? "en" : "ar";
    i18n.changeLanguage(next);
    applyDocumentDirection(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleItemToggle = (item: PortalNavItem) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenId(item.submenu ? item.to : null);
      return;
    }
    setOpenId((prev) => (prev === item.to ? null : item.to));
  };

  if (isInsideShell) {
    return <>{children}</>;
  }

  return (
    <PortalShellContext.Provider value={true}>
      <div className="flex min-h-screen bg-[var(--pd-canvas)] text-[var(--pd-text-primary)]">
        {/* Desktop Sculpted Floating Sidebar */}
        <aside
          className={`shape-feature hidden shrink-0 flex-col border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] shadow-[var(--pd-shadow-depth)] transition-[width,padding] duration-300 ease-out md:sticky md:top-4 md:m-4 md:flex md:h-[calc(100vh-2rem)] ${
            collapsed ? "w-[78px] px-2.5" : "w-[264px] px-4"
          }`}
        >
          <header
            className={`flex h-[70px] shrink-0 items-center gap-2.5 pt-1 ${
              collapsed ? "justify-center px-0" : "px-1"
            }`}
          >
            {!collapsed && (
              <Link
                to="/"
                className="flex min-w-0 items-center gap-2.5 truncate text-base font-semibold tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]"
              >
                <span className="pd-orb pd-orb--sm pd-orb--acid">
                  <StethoscopeIcon size={16} strokeWidth={1.7} />
                </span>
                <span className="truncate">PneumoDetect</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--pd-text-muted)] transition-colors hover:bg-[var(--pd-surface)] hover:text-[var(--pd-text-primary)] ${
                collapsed ? "mx-0" : "ms-auto"
              }`}
            >
              <MenuIcon size={17} strokeWidth={1.7} />
            </button>
          </header>

          {!collapsed && (
            <div className="mb-3 px-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--pd-orchid)_26%,transparent)] bg-[var(--pd-orchid-soft)] px-3 py-1 text-xs font-medium text-[var(--pd-orchid)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pd-orchid)]" />
                {portalBadge}
              </span>
            </div>
          )}

          <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-1">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.to}
                item={item}
                isOpen={openId === item.to && !collapsed}
                isCollapsed={collapsed}
                onToggle={() => handleItemToggle(item)}
              />
            ))}

            <li className="mt-auto mb-3 border-t border-[var(--pd-line)] pt-3">
              <button
                type="button"
                onClick={handleLogout}
                title={collapsed ? (isAr ? "تسجيل الخروج" : "Logout") : undefined}
                className={`flex h-11 w-full items-center rounded-[var(--shape-control)] text-sm font-medium text-[var(--pd-coral)] transition-colors hover:bg-[var(--pd-coral-soft)] ${
                  collapsed ? "justify-center px-0" : "gap-3 px-3.5"
                }`}
              >
                <LogOutIcon size={18} strokeWidth={1.7} className="shrink-0" />
                {!collapsed && <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>}
              </button>
            </li>
          </ul>
        </aside>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 flex p-3 md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[var(--pd-scrim)] backdrop-blur-xs"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              <motion.aside
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: isAr ? 24 : -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: isAr ? 24 : -24 }}
                transition={pdMotion.normal}
                className="shape-feature relative z-10 flex w-[276px] max-w-[85vw] flex-col border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-4 shadow-[var(--pd-shadow-float)]"
              >
                <header className="flex h-[70px] shrink-0 items-center justify-between px-1 pt-1">
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 text-base font-semibold text-[var(--pd-text-primary)]"
                  >
                    <span className="pd-orb pd-orb--sm pd-orb--acid">
                      <StethoscopeIcon size={16} strokeWidth={1.7} />
                    </span>
                    <span>PneumoDetect</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--pd-text-muted)] hover:bg-[var(--pd-surface)] hover:text-[var(--pd-text-primary)]"
                  >
                    <XIcon size={18} strokeWidth={1.7} />
                  </button>
                </header>

                <div className="mb-3 px-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--pd-orchid)_26%,transparent)] bg-[var(--pd-orchid-soft)] px-3 py-1 text-xs font-medium text-[var(--pd-orchid)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--pd-orchid)]" />
                    {portalBadge}
                  </span>
                </div>

                <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-1">
                  {navItems.map((item) => (
                    <SidebarNavItem
                      key={item.to}
                      item={item}
                      isOpen={openId === item.to}
                      isCollapsed={false}
                      onToggle={() => handleItemToggle(item)}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}

                  <li className="mt-auto mb-3 border-t border-[var(--pd-line)] pt-3">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex h-11 w-full items-center gap-3 rounded-[var(--shape-control)] px-3.5 text-sm font-medium text-[var(--pd-coral)] transition-colors hover:bg-[var(--pd-coral-soft)]"
                    >
                      <LogOutIcon size={18} strokeWidth={1.7} />
                      <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
                    </button>
                  </li>
                </ul>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopbar
            portalTitle={portalTitle}
            portalBadge={portalBadge}
            navItems={navItems}
            isAr={isAr}
            isDark={isDark}
            user={user}
            onOpenMobileMenu={() => setMobileOpen(true)}
            onToggleTheme={toggleTheme}
            onToggleLocale={handleToggleLocale}
            onLogout={handleLogout}
          />

          <main className="flex-1 p-4 sm:p-5 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>

          <footer className="border-t border-[var(--pd-line)] bg-[var(--pd-surface-deep)] px-4 py-3 text-xs text-[var(--pd-text-muted)] sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
              <span>PneumoDetect</span>
              <span>
                {isAr ? "منصة تشخيص الأشعة بالذكاء الاصطناعي" : "AI Chest X-Ray Screening Platform"}
              </span>
            </div>
          </footer>
        </div>
      </div>
    </PortalShellContext.Provider>
  );
}
