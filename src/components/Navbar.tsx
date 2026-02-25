"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";

interface NavbarProps {
  user: Profile;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-blue-700 flex items-center gap-2"
          >
            🎿 La Previa
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-sm text-gray-600 hover:text-blue-600 transition hidden sm:block"
            >
              {user.display_name || user.email}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
