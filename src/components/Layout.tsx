import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Target,
  Users,
  Megaphone,
  Settings,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  Bell,
  TrendingUp,
  Bot,
  UserPlus,
  LogOut,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuth } from "~/lib/auth";

interface UIStore {
  darkMode: boolean;
  sidebarOpen: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      darkMode: false,
      sidebarOpen: true,
      toggleDarkMode: () =>
        set((state) => ({ darkMode: !state.darkMode })),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "ui-store",
    },
  ),
);

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Offers", href: "/offers", icon: Target },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Activity", href: "/activity", icon: TrendingUp },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { darkMode, sidebarOpen, toggleDarkMode, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg">
                <Target className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                AffiliateAI
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                activeProps={{
                  className:
                    "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400",
                }}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || ""}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:pl-64 flex flex-col min-h-screen`}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg px-4 sm:px-6">
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={toggleSidebar}
              className="lg:hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="hidden sm:block flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search offers, campaigns, personas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Notifications */}
            <button className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger-500"></span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
