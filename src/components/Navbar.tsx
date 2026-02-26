"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";
import { Profile } from "@/lib/types";

interface NavbarProps {
  user: Profile;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2"
          >
            🌍 La Previa
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <Link
              href="/profile"
              className="text-sm text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition hidden sm:block"
            >
              {user.display_name || user.email}
            </Link>
            <button
              onClick={handleLogout}
              className="cursor-pointer text-sm text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
