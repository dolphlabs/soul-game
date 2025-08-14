"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface VirtualCurrency {
  coins: number
  gems: number
}

export interface PowerUp {
  id: string
  name: string
  description: string
  effect_type: string
  effect_value: number
  duration?: number
  cost_coins: number
  cost_gems: number
  rarity: string
  icon: string
}

export interface UserInventory {
  id: string
  item_type: string
  item_id: string
  quantity: number
  power_up?: PowerUp
}

export interface PremiumPlan {
  id: string
  name: string
  description: string
  price: number
  duration_days: number
  benefits: string[]
  popular?: boolean
}

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: "premium_monthly",
    name: "Premium Monthly",
    description: "Unlock all premium features for 30 days",
    price: 4.99,
    duration_days: 30,
    benefits: [
      "2x XP gain",
      "Unlimited power-ups",
      "Exclusive themes",
      "Priority leaderboard",
      "No ads",
      "Daily coin bonus",
    ],
  },
  {
    id: "premium_yearly",
    name: "Premium Yearly",
    description: "Best value! Premium features for a full year",
    price: 39.99,
    duration_days: 365,
    benefits: [
      "2x XP gain",
      "Unlimited power-ups",
      "Exclusive themes",
      "Priority leaderboard",
      "No ads",
      "Daily coin bonus",
      "Exclusive avatar frames",
      "Early access to new features",
    ],
    popular: true,
  },
  {
    id: "premium_lifetime",
    name: "Lifetime Premium",
    description: "One-time purchase for lifetime premium access",
    price: 99.99,
    duration_days: 36500, // 100 years
    benefits: [
      "All Premium Yearly benefits",
      "Lifetime access",
      "VIP support",
      "Exclusive lifetime badge",
      "Beta tester access",
    ],
  },
]

export async function getUserCurrency(userId: string): Promise<VirtualCurrency> {
  const supabase = createClient()

  const { data, error } = await supabase.from("virtual_currency").select("coins, gems").eq("user_id", userId).single()

  if (error || !data) {
    // Create initial currency record
    await supabase.from("virtual_currency").insert({
      user_id: userId,
      coins: 100, // Starting coins
      gems: 5, // Starting gems
    })
    return { coins: 100, gems: 5 }
  }

  return data
}

export async function getPowerUps(): Promise<PowerUp[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("power_ups").select("*").order("cost_coins", { ascending: true })

  if (error) {
    console.error("Error fetching power-ups:", error)
    return []
  }

  return data || []
}

export async function getUserInventory(userId: string): Promise<UserInventory[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_inventory")
    .select(`
      *,
      power_up:power_ups(*)
    `)
    .eq("user_id", userId)
    .eq("item_type", "power_up")

  if (error) {
    console.error("Error fetching user inventory:", error)
    return []
  }

  return data || []
}

export async function purchasePowerUp(powerUpId: string, paymentMethod: "coins" | "gems") {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Get power-up details
    const { data: powerUp, error: powerUpError } = await supabase
      .from("power_ups")
      .select("*")
      .eq("id", powerUpId)
      .single()

    if (powerUpError || !powerUp) {
      return { error: "Power-up not found" }
    }

    // Get user currency
    const currency = await getUserCurrency(user.id)
    const cost = paymentMethod === "coins" ? powerUp.cost_coins : powerUp.cost_gems
    const currentAmount = paymentMethod === "coins" ? currency.coins : currency.gems

    if (currentAmount < cost) {
      return { error: `Insufficient ${paymentMethod}` }
    }

    // Deduct currency
    const newAmount = currentAmount - cost
    const updateData = paymentMethod === "coins" ? { coins: newAmount } : { gems: newAmount }

    const { error: currencyError } = await supabase.from("virtual_currency").update(updateData).eq("user_id", user.id)

    if (currencyError) {
      return { error: "Failed to process payment" }
    }

    // Add to inventory
    const { data: existingItem } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_type", "power_up")
      .eq("item_id", powerUpId)
      .single()

    if (existingItem) {
      // Increase quantity
      await supabase
        .from("user_inventory")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("id", existingItem.id)
    } else {
      // Add new item
      await supabase.from("user_inventory").insert({
        user_id: user.id,
        item_type: "power_up",
        item_id: powerUpId,
        quantity: 1,
      })
    }

    // Record purchase
    await supabase.from("purchases").insert({
      user_id: user.id,
      product_id: powerUpId,
      product_type: "power_up",
      amount: cost,
      currency: paymentMethod === "coins" ? "COINS" : "GEMS",
      status: "completed",
    })

    revalidatePath("/store")
    return { success: true }
  } catch (error) {
    console.error("Purchase power-up error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function purchaseCurrency(
  packageType: "coins_small" | "coins_medium" | "coins_large" | "gems_small" | "gems_medium" | "gems_large",
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const packages = {
    coins_small: { coins: 500, gems: 0, price: 0.99 },
    coins_medium: { coins: 1200, gems: 0, price: 1.99 },
    coins_large: { coins: 2500, gems: 100, price: 4.99 }, // Bonus gems
    gems_small: { coins: 0, gems: 50, price: 0.99 },
    gems_medium: { coins: 0, gems: 120, price: 1.99 },
    gems_large: { coins: 500, gems: 250, price: 4.99 }, // Bonus coins
  }

  const packageData = packages[packageType]
  if (!packageData) {
    return { error: "Invalid package" }
  }

  try {
    // In a real app, this would integrate with Stripe, Apple Pay, Google Pay, etc.
    // For now, we'll simulate the purchase

    // Get current currency
    const currency = await getUserCurrency(user.id)

    // Add purchased currency
    const { error: currencyError } = await supabase
      .from("virtual_currency")
      .update({
        coins: currency.coins + packageData.coins,
        gems: currency.gems + packageData.gems,
      })
      .eq("user_id", user.id)

    if (currencyError) {
      return { error: "Failed to add currency" }
    }

    // Record purchase
    await supabase.from("purchases").insert({
      user_id: user.id,
      product_id: packageType,
      product_type: "currency",
      amount: packageData.price,
      currency: "USD",
      status: "completed",
    })

    revalidatePath("/store")
    return { success: true, message: `Added ${packageData.coins} coins and ${packageData.gems} gems!` }
  } catch (error) {
    console.error("Purchase currency error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function purchasePremium(planId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const plan = PREMIUM_PLANS.find((p) => p.id === planId)
  if (!plan) {
    return { error: "Invalid plan" }
  }

  try {
    // In a real app, this would integrate with payment processors
    // For now, we'll simulate the purchase

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days)

    // Update user premium status
    const { error: userError } = await supabase
      .from("users")
      .update({
        premium_member: true,
        premium_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id)

    if (userError) {
      return { error: "Failed to activate premium" }
    }

    // Record purchase
    await supabase.from("purchases").insert({
      user_id: user.id,
      product_id: planId,
      product_type: "premium",
      amount: plan.price,
      currency: "USD",
      status: "completed",
      expires_at: expiresAt.toISOString(),
    })

    // Give welcome bonus
    const currency = await getUserCurrency(user.id)
    await supabase
      .from("virtual_currency")
      .update({
        coins: currency.coins + 1000, // Premium welcome bonus
        gems: currency.gems + 50,
      })
      .eq("user_id", user.id)

    revalidatePath("/store")
    revalidatePath("/")
    return { success: true, message: `Welcome to ${plan.name}! Enjoy your premium benefits.` }
  } catch (error) {
    console.error("Purchase premium error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function usePowerUp(powerUpId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Check if user has the power-up
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_type", "power_up")
      .eq("item_id", powerUpId)
      .single()

    if (inventoryError || !inventoryItem || inventoryItem.quantity <= 0) {
      return { error: "Power-up not available" }
    }

    // Decrease quantity
    const newQuantity = inventoryItem.quantity - 1
    if (newQuantity > 0) {
      await supabase.from("user_inventory").update({ quantity: newQuantity }).eq("id", inventoryItem.id)
    } else {
      await supabase.from("user_inventory").delete().eq("id", inventoryItem.id)
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Use power-up error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function claimDailyBonus() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Check if user already claimed today
    const today = new Date().toDateString()
    const { data: existingClaim } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_type", "daily_bonus")
      .gte("purchased_at", new Date(today).toISOString())
      .single()

    if (existingClaim) {
      return { error: "Daily bonus already claimed today" }
    }

    // Get user data to check premium status
    const { data: userData } = await supabase
      .from("users")
      .select("premium_member, premium_expires_at")
      .eq("id", user.id)
      .single()

    const isPremium = userData?.premium_member && new Date(userData.premium_expires_at || 0) > new Date()
    const bonusCoins = isPremium ? 200 : 100
    const bonusGems = isPremium ? 10 : 5

    // Add daily bonus
    const currency = await getUserCurrency(user.id)
    await supabase
      .from("virtual_currency")
      .update({
        coins: currency.coins + bonusCoins,
        gems: currency.gems + bonusGems,
      })
      .eq("user_id", user.id)

    // Record claim
    await supabase.from("purchases").insert({
      user_id: user.id,
      product_id: "daily_bonus",
      product_type: "daily_bonus",
      amount: 0,
      currency: "FREE",
      status: "completed",
    })

    revalidatePath("/store")
    return {
      success: true,
      message: `Daily bonus claimed! +${bonusCoins} coins, +${bonusGems} gems${isPremium ? " (Premium bonus!)" : ""}`,
    }
  } catch (error) {
    console.error("Claim daily bonus error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function activatePowerUp(powerUpId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Check if user has the power-up
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_type", "power_up")
      .eq("item_id", powerUpId)
      .single()

    if (inventoryError || !inventoryItem || inventoryItem.quantity <= 0) {
      return { error: "Power-up not available" }
    }

    // Decrease quantity
    const newQuantity = inventoryItem.quantity - 1
    if (newQuantity > 0) {
      await supabase.from("user_inventory").update({ quantity: newQuantity }).eq("id", inventoryItem.id)
    } else {
      await supabase.from("user_inventory").delete().eq("id", inventoryItem.id)
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Activate power-up error:", error)
    return { error: "An unexpected error occurred" }
  }
}
