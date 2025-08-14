import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import GameBoard from "@/components/game-board"

export default async function Home() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user stats
  const { data: userStats } = await supabase
    .from("users")
    .select("total_games_played, total_score, best_score, best_streak, level, experience_points")
    .eq("id", user.id)
    .single()

  return <GameBoard user={user} userStats={userStats} />
}
