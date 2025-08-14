"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GameEngine, type GameState, type ColorChallenge } from "@/lib/game-engine"
import { LogOut, Trophy, Users, ShoppingBag, Crown, Coins, Gem } from "lucide-react"
import { signOut, saveGameScore } from "@/lib/actions"
import { shareScore } from "@/lib/social-actions"
import {
  getUserCurrency,
  getUserInventory,
  activatePowerUp,
  type VirtualCurrency,
  type UserInventory,
} from "@/lib/monetization-actions"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface GameBoardProps {
  user: any
  userStats: any
}

export default function GameBoard({ user, userStats }: GameBoardProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentChallenge, setCurrentChallenge] = useState<ColorChallenge | null>(null)
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currency, setCurrency] = useState<VirtualCurrency>({ coins: 0, gems: 0 })
  const [inventory, setInventory] = useState<UserInventory[]>([])

  const isPremium = userStats?.premium_member && new Date(userStats.premium_expires_at || 0) > new Date()

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state)
  }, [])

  const handleChallengeChange = useCallback((challenge: ColorChallenge) => {
    setCurrentChallenge(challenge)
    setSelectedOption(null)
    setFeedback(null)
  }, [])

  const handleGameEnd = useCallback(
    async (finalScore: number) => {
      if (!gameState) return

      setIsSaving(true)
      try {
        await saveGameScore({
          score: finalScore,
          level: gameState.level,
          colorsMatched: gameState.colorsMatched,
          perfectMatches: gameState.perfectMatches,
          maxStreak: gameState.maxStreak,
          timePlayed: gameState.timePlayed,
          gameMode: gameState.gameMode,
          difficulty: gameState.difficulty,
        })
      } catch (error) {
        console.error("Failed to save game score:", error)
      } finally {
        setIsSaving(false)
      }
    },
    [gameState],
  )

  const handleUsePowerUp = async (powerUpId: string) => {
    try {
      const result = await activatePowerUp(powerUpId)
      if (result.success) {
        if (gameEngine) {
          gameEngine.activatePowerUp(powerUpId)
        }
        loadUserData()
        toast({
          title: "Power-up activated!",
          description: "Enjoy the boost!",
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to use power-up",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const engine = new GameEngine(handleStateChange, handleChallengeChange, handleGameEnd)
    setGameEngine(engine)
    loadUserData()

    return () => {
      engine.destroy()
    }
  }, [handleStateChange, handleChallengeChange, handleGameEnd])

  const loadUserData = async () => {
    try {
      const [currencyData, inventoryData] = await Promise.all([getUserCurrency(user.id), getUserInventory(user.id)])
      setCurrency(currencyData)
      setInventory(inventoryData)
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const startNewGame = () => {
    if (gameEngine) {
      gameEngine.startGame("classic", "normal")
    }
  }

  const pauseResumeGame = () => {
    if (gameEngine && gameState) {
      if (gameState.isPaused) {
        gameEngine.resumeGame()
      } else {
        gameEngine.pauseGame()
      }
    }
  }

  const handleColorClick = (optionId: string) => {
    if (!gameEngine || !currentChallenge || !gameState?.isPlaying || gameState.isPaused) return

    setSelectedOption(optionId)
    const selectedOption = currentChallenge.options.find((opt) => opt.id === optionId)

    if (selectedOption?.isCorrect) {
      setFeedback("correct")
    } else {
      setFeedback("wrong")
    }

    setTimeout(() => {
      gameEngine.handleColorSelection(optionId, currentChallenge)
    }, 500)
  }

  const handleShareScore = async () => {
    if (!gameState) return

    try {
      const result = await shareScore(gameState.score, gameState.level)
      if (result.success && result.shareText && result.shareUrl) {
        await navigator.clipboard.writeText(`${result.shareText}\n${result.shareUrl}`)
        toast({
          title: "Score shared!",
          description: "Share text copied to clipboard",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share score",
        variant: "destructive",
      })
    }
  }

  const getPowerUpQuantity = (powerUpId: string) => {
    const item = inventory.find((i) => i.item_id === powerUpId)
    return item?.quantity || 0
  }

  if (!gameState || !gameEngine) {
    return (
      <div className="min-h-screen bg-background p-4">
        {/* Header with user info */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-primary">Color Rush</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">Welcome back, {user.email}!</p>
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-primary to-secondary">
                    <Crown className="mr-1 h-3 w-3" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/store">
                <Button variant="outline">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Store
                </Button>
              </Link>
              <Link href="/social">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Social
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="outline">
                  <Trophy className="mr-2 h-4 w-4" />
                  Leaderboard
                </Button>
              </Link>
              <form action={signOut}>
                <Button variant="outline" type="submit">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>

          {/* Currency Display */}
          <Card className="p-4 mb-6 bg-gradient-to-r from-secondary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-secondary" />
                  <span className="text-lg font-bold">{currency.coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gem className="h-5 w-5 text-accent" />
                  <span className="text-lg font-bold">{currency.gems.toLocaleString()}</span>
                </div>
              </div>
              <Link href="/store">
                <Button variant="outline" size="sm">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Get More
                </Button>
              </Link>
            </div>
          </Card>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{userStats?.best_score || 0}</div>
              <div className="text-sm text-muted-foreground">Best Score</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">{userStats?.level || 1}</div>
              <div className="text-sm text-muted-foreground">Level</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{userStats?.total_games_played || 0}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-chart-3">{userStats?.best_streak || 0}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
            <p className="text-muted-foreground mb-6">Match colors as fast as you can and climb the leaderboards!</p>
            <Button onClick={startNewGame} size="lg" className="w-full">
              Start New Game
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header with user info */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primary">Color Rush</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">Welcome back, {user.email}!</p>
              {isPremium && (
                <Badge className="bg-gradient-to-r from-primary to-secondary">
                  <Crown className="mr-1 h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/store">
              <Button variant="outline">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Store
              </Button>
            </Link>
            <Link href="/social">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Social
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline">
                <Trophy className="mr-2 h-4 w-4" />
                Leaderboard
              </Button>
            </Link>
            <form action={signOut}>
              <Button variant="outline" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        {/* Currency Display */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-secondary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-secondary" />
                <span className="text-lg font-bold">{currency.coins.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-accent" />
                <span className="text-lg font-bold">{currency.gems.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/store">
              <Button variant="outline" size="sm">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Get More
              </Button>
            </Link>
          </div>
        </Card>

        {/* Power-ups Bar */}
        {inventory.length > 0 && (
          <Card className="p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Power-ups</h3>
            <div className="flex gap-2 flex-wrap">
              {["time_freeze", "score_multiplier", "extra_life", "hint"].map((powerUpId) => {
                const quantity = getPowerUpQuantity(powerUpId)
                if (quantity === 0) return null

                return (
                  <Button
                    key={powerUpId}
                    variant="outline"
                    size="sm"
                    onClick={() => handleUsePowerUp(powerUpId)}
                    disabled={!gameState.isPlaying || gameState.isPaused}
                    className="relative"
                  >
                    {powerUpId.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{quantity}</Badge>
                  </Button>
                )
              })}
            </div>
          </Card>
        )}

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{gameState.score}</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{gameState.level}</div>
            <div className="text-sm text-muted-foreground">Level</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{gameState.streak}</div>
            <div className="text-sm text-muted-foreground">Streak</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-chart-3">{gameState.lives}</div>
            <div className="text-sm text-muted-foreground">Lives</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-chart-4">{Math.ceil(gameState.timeLeft)}</div>
            <div className="text-sm text-muted-foreground">Time</div>
          </Card>
        </div>
      </div>

      {/* Game Area */}
      <div className="max-w-2xl mx-auto">
        {gameState.isPlaying && currentChallenge ? (
          <Card className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Find the matching color!</h2>
              <div
                className="w-24 h-24 mx-auto rounded-lg border-4 border-primary shadow-lg"
                style={{ backgroundColor: currentChallenge.targetColor }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {currentChallenge.options.map((option) => (
                <Button
                  key={option.id}
                  onClick={() => handleColorClick(option.id)}
                  className={`h-20 rounded-lg border-2 transition-all duration-200 ${
                    selectedOption === option.id
                      ? feedback === "correct"
                        ? "border-green-500 scale-105"
                        : feedback === "wrong"
                          ? "border-red-500 scale-95"
                          : "border-primary"
                      : "border-muted hover:border-primary hover:scale-105"
                  }`}
                  style={{ backgroundColor: option.color }}
                  disabled={selectedOption !== null}
                />
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={pauseResumeGame} variant="outline">
                {gameState.isPaused ? "Resume" : "Pause"}
              </Button>
              <Button onClick={handleShareScore} variant="outline">
                Share Score
              </Button>
            </div>
          </Card>
        ) : gameState.isGameOver ? (
          <Card className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-2xl font-bold text-primary">{gameState.score}</div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{gameState.level}</div>
                <div className="text-sm text-muted-foreground">Level Reached</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{gameState.maxStreak}</div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-chart-3">{gameState.colorsMatched}</div>
                <div className="text-sm text-muted-foreground">Colors Matched</div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={startNewGame} size="lg">
                Play Again
              </Button>
              <Button onClick={handleShareScore} variant="outline" size="lg">
                Share Score
              </Button>
            </div>
            {isSaving && <p className="text-sm text-muted-foreground mt-4">Saving your score...</p>}
          </Card>
        ) : gameState.isPaused ? (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
            <Button onClick={pauseResumeGame} size="lg">
              Resume Game
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
