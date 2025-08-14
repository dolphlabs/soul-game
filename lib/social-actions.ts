"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: "pending" | "accepted" | "blocked"
  created_at: string
  accepted_at?: string
  friend: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
    level: number
    best_score: number
    last_played_at?: string
  }
}

export interface ActivityItem {
  id: string
  user_id: string
  activity_type: string
  activity_data: any
  created_at: string
  user: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

export interface Challenge {
  id: string
  challenger_id: string
  challenged_id: string
  target_score: number
  game_mode: string
  difficulty: string
  status: "pending" | "accepted" | "completed" | "expired"
  challenger_best_score: number
  challenged_best_score: number
  expires_at: string
  created_at: string
  completed_at?: string
  challenger: {
    username: string
    display_name: string
    avatar_url?: string
  }
  challenged: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

export async function sendFriendRequest(friendUsername: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Find the friend by username
    const { data: friendData, error: friendError } = await supabase
      .from("users")
      .select("id")
      .eq("username", friendUsername)
      .single()

    if (friendError || !friendData) {
      return { error: "User not found" }
    }

    if (friendData.id === user.id) {
      return { error: "Cannot add yourself as a friend" }
    }

    // Check if friendship already exists
    const { data: existingFriend } = await supabase
      .from("friends")
      .select("*")
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${friendData.id}),and(user_id.eq.${friendData.id},friend_id.eq.${user.id})`,
      )
      .single()

    if (existingFriend) {
      return { error: "Friend request already exists or you are already friends" }
    }

    // Send friend request
    const { error: insertError } = await supabase.from("friends").insert({
      user_id: user.id,
      friend_id: friendData.id,
      status: "pending",
    })

    if (insertError) {
      return { error: "Failed to send friend request" }
    }

    // Add activity
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      activity_type: "friend_request_sent",
      activity_data: { friend_username: friendUsername },
    })

    revalidatePath("/social")
    return { success: true }
  } catch (error) {
    console.error("Send friend request error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    const { error } = await supabase
      .from("friends")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", friendshipId)
      .eq("friend_id", user.id)

    if (error) {
      return { error: "Failed to accept friend request" }
    }

    // Add reciprocal friendship
    const { data: friendship } = await supabase
      .from("friends")
      .select("user_id, friend_id")
      .eq("id", friendshipId)
      .single()

    if (friendship) {
      await supabase.from("friends").insert({
        user_id: user.id,
        friend_id: friendship.user_id,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })

      // Add activity
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        activity_type: "friend_added",
        activity_data: { friend_id: friendship.user_id },
      })
    }

    revalidatePath("/social")
    return { success: true }
  } catch (error) {
    console.error("Accept friend request error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getFriends(userId: string): Promise<Friend[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("friends")
    .select(`
      *,
      friend:users!friends_friend_id_fkey(id, username, display_name, avatar_url, level, best_score, last_played_at)
    `)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })

  if (error) {
    console.error("Get friends error:", error)
    return []
  }

  return data || []
}

export async function getFriendRequests(userId: string): Promise<Friend[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("friends")
    .select(`
      *,
      friend:users!friends_user_id_fkey(id, username, display_name, avatar_url, level, best_score, last_played_at)
    `)
    .eq("friend_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get friend requests error:", error)
    return []
  }

  return data || []
}

export async function getActivityFeed(userId: string): Promise<ActivityItem[]> {
  const supabase = createClient()

  // Get user's friends
  const { data: friends } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId)
    .eq("status", "accepted")

  const friendIds = friends?.map((f) => f.friend_id) || []
  friendIds.push(userId) // Include user's own activities

  const { data, error } = await supabase
    .from("activity_feed")
    .select(`
      *,
      user:users(username, display_name, avatar_url)
    `)
    .in("user_id", friendIds)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Get activity feed error:", error)
    return []
  }

  return data || []
}

export async function createChallenge(
  challengedUsername: string,
  targetScore: number,
  gameMode: string,
  difficulty: string,
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Find the challenged user
    const { data: challengedUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", challengedUsername)
      .single()

    if (userError || !challengedUser) {
      return { error: "User not found" }
    }

    // Create challenge
    const { error: insertError } = await supabase.from("challenges").insert({
      challenger_id: user.id,
      challenged_id: challengedUser.id,
      target_score: targetScore,
      game_mode: gameMode,
      difficulty: difficulty,
    })

    if (insertError) {
      return { error: "Failed to create challenge" }
    }

    // Add activity
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      activity_type: "challenge_sent",
      activity_data: { challenged_username: challengedUsername, target_score: targetScore },
    })

    revalidatePath("/social")
    return { success: true }
  } catch (error) {
    console.error("Create challenge error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getChallenges(userId: string): Promise<Challenge[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("challenges")
    .select(`
      *,
      challenger:users!challenges_challenger_id_fkey(username, display_name, avatar_url),
      challenged:users!challenges_challenged_id_fkey(username, display_name, avatar_url)
    `)
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get challenges error:", error)
    return []
  }

  return data || []
}

export async function shareScore(score: number, level: number, platform?: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Save share record
    await supabase.from("social_shares").insert({
      user_id: user.id,
      share_type: "score",
      share_data: { score, level },
      platform: platform || "copy_link",
    })

    // Add activity
    await supabase.from("activity_feed").insert({
      user_id: user.id,
      activity_type: "score_shared",
      activity_data: { score, level },
    })

    // Generate share text
    const shareText = `I just scored ${score.toLocaleString()} points on Color Rush! Can you beat my score? 🎮`
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://colorush.vercel.app"}`

    revalidatePath("/social")
    return { success: true, shareText, shareUrl }
  } catch (error) {
    console.error("Share score error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateUserProfile(profileData: {
  username?: string
  display_name?: string
  country?: string
  state?: string
  avatar_url?: string
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    const { error } = await supabase.from("users").update(profileData).eq("id", user.id)

    if (error) {
      return { error: "Failed to update profile" }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return { error: "An unexpected error occurred" }
  }
}
