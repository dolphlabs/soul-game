"use server"

import { createClient } from "@/lib/supabase/server"

export interface LeaderboardEntry {
  id: string
  user_id: string
  username: string
  display_name: string
  score: number
  rank: number
  country?: string
  state?: string
  avatar_url?: string
  level: number
  total_games_played: number
}

export async function getGlobalLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, best_score, country, state, avatar_url, level, total_games_played")
    .order("best_score", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching global leaderboard:", error)
    return []
  }

  return data.map((user, index) => ({
    id: user.id,
    user_id: user.id,
    username: user.username || user.display_name || "Anonymous",
    display_name: user.display_name || user.username || "Anonymous",
    score: user.best_score || 0,
    rank: index + 1,
    country: user.country,
    state: user.state,
    avatar_url: user.avatar_url,
    level: user.level || 1,
    total_games_played: user.total_games_played || 0,
  }))
}

export async function getCountryLeaderboard(country: string, limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, best_score, country, state, avatar_url, level, total_games_played")
    .eq("country", country)
    .order("best_score", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching country leaderboard:", error)
    return []
  }

  return data.map((user, index) => ({
    id: user.id,
    user_id: user.id,
    username: user.username || user.display_name || "Anonymous",
    display_name: user.display_name || user.username || "Anonymous",
    score: user.best_score || 0,
    rank: index + 1,
    country: user.country,
    state: user.state,
    avatar_url: user.avatar_url,
    level: user.level || 1,
    total_games_played: user.total_games_played || 0,
  }))
}

export async function getStateLeaderboard(country: string, state: string, limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, best_score, country, state, avatar_url, level, total_games_played")
    .eq("country", country)
    .eq("state", state)
    .order("best_score", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching state leaderboard:", error)
    return []
  }

  return data.map((user, index) => ({
    id: user.id,
    user_id: user.id,
    username: user.username || user.display_name || "Anonymous",
    display_name: user.display_name || user.username || "Anonymous",
    score: user.best_score || 0,
    rank: index + 1,
    country: user.country,
    state: user.state,
    avatar_url: user.avatar_url,
    level: user.level || 1,
    total_games_played: user.total_games_played || 0,
  }))
}

export async function getDailyLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("game_sessions")
    .select(`
      score,
      user_id,
      users!inner(id, username, display_name, country, state, avatar_url, level, total_games_played)
    `)
    .gte("completed_at", today.toISOString())
    .order("score", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching daily leaderboard:", error)
    return []
  }

  // Group by user and get their best score for today
  const userBestScores = new Map()
  data.forEach((session: any) => {
    const userId = session.user_id
    const currentBest = userBestScores.get(userId)
    if (!currentBest || session.score > currentBest.score) {
      userBestScores.set(userId, {
        ...session,
        user: session.users,
      })
    }
  })

  const sortedEntries = Array.from(userBestScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return sortedEntries.map((entry, index) => ({
    id: entry.user.id,
    user_id: entry.user.id,
    username: entry.user.username || entry.user.display_name || "Anonymous",
    display_name: entry.user.display_name || entry.user.username || "Anonymous",
    score: entry.score,
    rank: index + 1,
    country: entry.user.country,
    state: entry.user.state,
    avatar_url: entry.user.avatar_url,
    level: entry.user.level || 1,
    total_games_played: entry.user.total_games_played || 0,
  }))
}

export async function getWeeklyLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from("game_sessions")
    .select(`
      score,
      user_id,
      users!inner(id, username, display_name, country, state, avatar_url, level, total_games_played)
    `)
    .gte("completed_at", weekAgo.toISOString())
    .order("score", { ascending: false })
    .limit(limit * 3) // Get more to account for multiple games per user

  if (error) {
    console.error("Error fetching weekly leaderboard:", error)
    return []
  }

  // Group by user and get their best score for the week
  const userBestScores = new Map()
  data.forEach((session: any) => {
    const userId = session.user_id
    const currentBest = userBestScores.get(userId)
    if (!currentBest || session.score > currentBest.score) {
      userBestScores.set(userId, {
        ...session,
        user: session.users,
      })
    }
  })

  const sortedEntries = Array.from(userBestScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return sortedEntries.map((entry, index) => ({
    id: entry.user.id,
    user_id: entry.user.id,
    username: entry.user.username || entry.user.display_name || "Anonymous",
    display_name: entry.user.display_name || entry.user.username || "Anonymous",
    score: entry.score,
    rank: index + 1,
    country: entry.user.country,
    state: entry.user.state,
    avatar_url: entry.user.avatar_url,
    level: entry.user.level || 1,
    total_games_played: entry.user.total_games_played || 0,
  }))
}

export async function getUserRank(userId: string): Promise<{
  globalRank: number
  countryRank: number
  stateRank: number
  totalPlayers: number
}> {
  const supabase = createClient()

  // Get user's score and location
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("best_score, country, state")
    .eq("id", userId)
    .single()

  if (userError || !user) {
    return { globalRank: 0, countryRank: 0, stateRank: 0, totalPlayers: 0 }
  }

  // Get global rank
  const { count: globalRank } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("best_score", user.best_score || 0)

  // Get total players
  const { count: totalPlayers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("total_games_played", 0)

  // Get country rank
  let countryRank = 0
  if (user.country) {
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("country", user.country)
      .gt("best_score", user.best_score || 0)
    countryRank = (count || 0) + 1
  }

  // Get state rank
  let stateRank = 0
  if (user.country && user.state) {
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("country", user.country)
      .eq("state", user.state)
      .gt("best_score", user.best_score || 0)
    stateRank = (count || 0) + 1
  }

  return {
    globalRank: (globalRank || 0) + 1,
    countryRank,
    stateRank,
    totalPlayers: totalPlayers || 0,
  }
}
