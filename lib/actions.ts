"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const username = formData.get("username")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/game`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    // Create user profile after successful signup
    if (data.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        username: username?.toString() || null,
        display_name: username?.toString() || data.user.email?.split("@")[0],
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
      }
    }

    return { success: "Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function saveGameScore(gameData: {
  score: number
  level: number
  colorsMatched: number
  perfectMatches: number
  maxStreak: number
  timePlayed: number
  gameMode: string
  difficulty: string
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  try {
    // Insert game session
    const { error: sessionError } = await supabase.from("game_sessions").insert({
      user_id: user.id,
      score: gameData.score,
      level_reached: gameData.level,
      colors_matched: gameData.colorsMatched,
      perfect_matches: gameData.perfectMatches,
      max_streak: gameData.maxStreak,
      time_played: gameData.timePlayed,
      game_mode: gameData.gameMode,
      difficulty: gameData.difficulty,
    })

    if (sessionError) {
      console.error("Session save error:", sessionError)
      return { error: "Failed to save game session" }
    }

    // Update user stats
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("total_games_played, total_score, best_score, best_streak, level, experience_points")
      .eq("id", user.id)
      .single()

    if (fetchError) {
      console.error("User fetch error:", fetchError)
      return { error: "Failed to fetch user data" }
    }

    const newTotalGames = (currentUser.total_games_played || 0) + 1
    const newTotalScore = (currentUser.total_score || 0) + gameData.score
    const newBestScore = Math.max(currentUser.best_score || 0, gameData.score)
    const newBestStreak = Math.max(currentUser.best_streak || 0, gameData.maxStreak)
    const newXP = (currentUser.experience_points || 0) + Math.floor(gameData.score / 10)
    const newLevel = Math.floor(newXP / 1000) + 1

    const { error: updateError } = await supabase
      .from("users")
      .update({
        total_games_played: newTotalGames,
        total_score: newTotalScore,
        best_score: newBestScore,
        best_streak: newBestStreak,
        level: newLevel,
        experience_points: newXP,
        last_played_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("User update error:", updateError)
      return { error: "Failed to update user stats" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Save game error:", error)
    return { error: "An unexpected error occurred while saving the game" }
  }
}
