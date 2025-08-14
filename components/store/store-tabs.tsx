"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, Gem, Zap, Crown, Gift, ShoppingCart } from "lucide-react"
import {
  getUserCurrency,
  getPowerUps,
  getUserInventory,
  purchasePowerUp,
  purchaseCurrency,
  purchasePremium,
  claimDailyBonus,
  PREMIUM_PLANS,
  type VirtualCurrency,
  type PowerUp,
  type UserInventory,
} from "@/lib/monetization-actions"
import { toast } from "@/hooks/use-toast"

interface StoreTabsProps {
  currentUser: any
  userStats: any
}

export default function StoreTabs({ currentUser, userStats }: StoreTabsProps) {
  const [currency, setCurrency] = useState<VirtualCurrency>({ coins: 0, gems: 0 })
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [inventory, setInventory] = useState<UserInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const isPremium = userStats?.premium_member && new Date(userStats.premium_expires_at || 0) > new Date()

  useEffect(() => {
    loadStoreData()
  }, [currentUser.id])

  const loadStoreData = async () => {
    setLoading(true)
    try {
      const [currencyData, powerUpsData, inventoryData] = await Promise.all([
        getUserCurrency(currentUser.id),
        getPowerUps(),
        getUserInventory(currentUser.id),
      ])
      setCurrency(currencyData)
      setPowerUps(powerUpsData)
      setInventory(inventoryData)
    } catch (error) {
      console.error("Error loading store data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchasePowerUp = async (powerUpId: string, paymentMethod: "coins" | "gems") => {
    setPurchasing(powerUpId)
    try {
      const result = await purchasePowerUp(powerUpId, paymentMethod)
      if (result.error) {
        toast({
          title: "Purchase Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Purchase Successful",
          description: "Power-up added to your inventory!",
        })
        loadStoreData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase power-up",
        variant: "destructive",
      })
    } finally {
      setPurchasing(null)
    }
  }

  const handlePurchaseCurrency = async (packageType: any) => {
    setPurchasing(packageType)
    try {
      const result = await purchaseCurrency(packageType)
      if (result.error) {
        toast({
          title: "Purchase Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Purchase Successful",
          description: result.message,
        })
        loadStoreData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase currency",
        variant: "destructive",
      })
    } finally {
      setPurchasing(null)
    }
  }

  const handlePurchasePremium = async (planId: string) => {
    setPurchasing(planId)
    try {
      const result = await purchasePremium(planId)
      if (result.error) {
        toast({
          title: "Purchase Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Welcome to Premium!",
          description: result.message,
        })
        loadStoreData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase premium",
        variant: "destructive",
      })
    } finally {
      setPurchasing(null)
    }
  }

  const handleClaimDailyBonus = async () => {
    setPurchasing("daily_bonus")
    try {
      const result = await claimDailyBonus()
      if (result.error) {
        toast({
          title: "Claim Failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Daily Bonus Claimed!",
          description: result.message,
        })
        loadStoreData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim daily bonus",
        variant: "destructive",
      })
    } finally {
      setPurchasing(null)
    }
  }

  const getInventoryQuantity = (powerUpId: string) => {
    const item = inventory.find((i) => i.item_id === powerUpId)
    return item?.quantity || 0
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Store</h1>
        <p className="text-muted-foreground">Enhance your gaming experience</p>
      </div>

      {/* Currency Display */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-secondary" />
              <span className="text-2xl font-bold">{currency.coins.toLocaleString()}</span>
              <span className="text-muted-foreground">Coins</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem className="h-6 w-6 text-accent" />
              <span className="text-2xl font-bold">{currency.gems.toLocaleString()}</span>
              <span className="text-muted-foreground">Gems</span>
            </div>
          </div>
          <Button
            onClick={handleClaimDailyBonus}
            disabled={purchasing === "daily_bonus"}
            className="flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            {purchasing === "daily_bonus" ? "Claiming..." : "Daily Bonus"}
          </Button>
        </div>
      </Card>

      {/* Store Tabs */}
      <Tabs defaultValue="powerups">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="powerups" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Power-ups
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Currency
          </TabsTrigger>
          <TabsTrigger value="premium" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Premium
          </TabsTrigger>
        </TabsList>

        <TabsContent value="powerups" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {powerUps.map((powerUp) => {
              const quantity = getInventoryQuantity(powerUp.id)
              return (
                <Card key={powerUp.id} className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{powerUp.icon}</div>
                    <h3 className="text-lg font-semibold">{powerUp.name}</h3>
                    <p className="text-sm text-muted-foreground">{powerUp.description}</p>
                    <Badge variant="secondary" className="mt-2">
                      {powerUp.rarity}
                    </Badge>
                  </div>

                  {quantity > 0 && (
                    <div className="text-center mb-4">
                      <Badge variant="outline">Owned: {quantity}</Badge>
                    </div>
                  )}

                  <div className="space-y-2">
                    {powerUp.cost_coins > 0 && (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => handlePurchasePowerUp(powerUp.id, "coins")}
                        disabled={purchasing === powerUp.id || currency.coins < powerUp.cost_coins}
                      >
                        <Coins className="mr-2 h-4 w-4" />
                        {powerUp.cost_coins} Coins
                      </Button>
                    )}
                    {powerUp.cost_gems > 0 && (
                      <Button
                        className="w-full"
                        onClick={() => handlePurchasePowerUp(powerUp.id, "gems")}
                        disabled={purchasing === powerUp.id || currency.gems < powerUp.cost_gems}
                      >
                        <Gem className="mr-2 h-4 w-4" />
                        {powerUp.cost_gems} Gems
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="currency" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Coin Packages */}
            <Card className="p-6">
              <div className="text-center mb-4">
                <Coins className="h-12 w-12 text-secondary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Small Coin Pack</h3>
                <p className="text-sm text-muted-foreground">500 Coins</p>
              </div>
              <Button
                className="w-full"
                onClick={() => handlePurchaseCurrency("coins_small")}
                disabled={purchasing === "coins_small"}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                $0.99
              </Button>
            </Card>

            <Card className="p-6">
              <div className="text-center mb-4">
                <Coins className="h-12 w-12 text-secondary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Medium Coin Pack</h3>
                <p className="text-sm text-muted-foreground">1,200 Coins</p>
              </div>
              <Button
                className="w-full"
                onClick={() => handlePurchaseCurrency("coins_medium")}
                disabled={purchasing === "coins_medium"}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                $1.99
              </Button>
            </Card>

            <Card className="p-6 border-primary">
              <div className="text-center mb-4">
                <Coins className="h-12 w-12 text-secondary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Large Coin Pack</h3>
                <p className="text-sm text-muted-foreground">2,500 Coins + 100 Gems</p>
                <Badge className="mt-1">Best Value</Badge>
              </div>
              <Button
                className="w-full"
                onClick={() => handlePurchaseCurrency("coins_large")}
                disabled={purchasing === "coins_large"}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                $4.99
              </Button>
            </Card>

            {/* Gem Packages */}
            <Card className="p-6">
              <div className="text-center mb-4">
                <Gem className="h-12 w-12 text-accent mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Small Gem Pack</h3>
                <p className="text-sm text-muted-foreground">50 Gems</p>
              </div>
              <Button
                className="w-full"
                onClick={() => handlePurchaseCurrency("gems_small")}
                disabled={purchasing === "gems_small"}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                $0.99
              </Button>
            </Card>

            <Card className="p-6">
              <div className="text-center mb-4">
                <Gem className="h-12 w-12 text-accent mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Medium Gem Pack</h3>
                <p className="text-sm text-muted-foreground">120 Gems</p>
              </div>
              <Button
                className="w-full"
                onClick={() => handlePurchaseCurrency("gems_medium")}
                disabled={purchasing === "gems_medium"}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                $1.99
              </Button>
            </Card>

            <Card className="p-6 border-accent">
              <div className="text-center mb-4">
                <Gem className="h-12 w-12 text-accent mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Large Gem Pack</h3>
                <p className="text-sm text-muted-foreground">250 Gems + 500 Coins</p>
                <Badge className="mt-1">Bonus Coins</Badge>
              </div>
              <Button
                className="w-full"
                onClick={() => handlePurchaseCurrency("gems_large")}
                disabled={purchasing === "gems_large"}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                $4.99
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="premium" className="mt-6">
          {isPremium ? (
            <Card className="p-8 text-center bg-gradient-to-r from-primary/10 to-secondary/10">
              <Crown className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-primary mb-2">You're Premium!</h2>
              <p className="text-muted-foreground mb-4">
                Premium expires: {new Date(userStats.premium_expires_at).toLocaleDateString()}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">2x XP</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">No Ads</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Daily Bonus</Badge>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PREMIUM_PLANS.map((plan) => (
                <Card key={plan.id} className={`p-6 ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}>
                  {plan.popular && (
                    <div className="text-center mb-4">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <Crown className="h-12 w-12 text-primary mx-auto mb-2" />
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <div className="text-3xl font-bold text-primary">${plan.price}</div>
                    <div className="text-sm text-muted-foreground">
                      {plan.duration_days === 36500 ? "One-time" : `${plan.duration_days} days`}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handlePurchasePremium(plan.id)}
                    disabled={purchasing === plan.id}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {purchasing === plan.id ? "Processing..." : "Upgrade Now"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
