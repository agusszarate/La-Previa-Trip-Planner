import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import TripNav from "@/components/TripNav";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function TripLayout({ children, params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/");

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (!trip) redirect("/dashboard");

  const { data: members } = await supabase
    .from("trip_members")
    .select("*, profiles(*)")
    .eq("trip_id", id);

  const userMember = members?.find((m) => m.user_id === user.id);
  const isOwner = userMember?.role === "owner";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <Navbar user={profile} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact trip header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard"
            className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-sm"
          >
            ← Mis viajes
          </Link>
          <span className="text-gray-300 dark:text-slate-600">/</span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {trip.name}
          </h1>
          {trip.destination && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full font-medium">
              📍 {trip.destination}
            </span>
          )}
        </div>

        {/* Sub-navigation */}
        <div className="mb-6">
          <TripNav tripId={id} isOwner={isOwner} />
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
