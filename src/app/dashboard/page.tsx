import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function DashboardPage() {
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

  // Get trips where user is a member
  const { data: memberships } = await supabase
    .from("trip_members")
    .select("trip_id, role, trips(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const trips = memberships?.map((m) => ({
    ...m.trips,
    role: m.role,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <Navbar user={profile} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ¡Hola, {profile.display_name || "viajero"}!
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">Tus viajes</p>
          </div>
          <Link
            href="/trips/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
          >
            + Nuevo Viaje
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
            <div className="text-5xl mb-4">🏔️</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-2">
              No tenés viajes todavía
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Creá tu primer viaje y sumá a tus amigos
            </p>
            <Link
              href="/trips/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition inline-block"
            >
              Crear mi primer viaje
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip: any) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl">
                    {trip.destination?.toLowerCase().includes("bariloche")
                      ? "🏔️"
                      : trip.destination?.toLowerCase().includes("chapelco")
                      ? "⛷️"
                      : "🎿"}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      trip.role === "owner"
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                    }`}
                  >
                    {trip.role === "owner" ? "Organizador" : "Miembro"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {trip.name}
                </h3>
                {trip.destination && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    📍 {trip.destination}
                  </p>
                )}
                {trip.start_date && (
                  <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                    📅{" "}
                    {new Date(trip.start_date).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}
                    {trip.end_date &&
                      ` — ${new Date(trip.end_date).toLocaleDateString(
                        "es-AR",
                        { day: "numeric", month: "short" }
                      )}`}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
