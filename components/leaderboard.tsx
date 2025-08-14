"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getGlobalLeaderboard,
  getCountryLeaderboard,
  getStateLeaderboard,
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  getUserRank,
  type LeaderboardEntry,
} from "@/lib/leaderboard-actions"
import { Trophy, Medal, Award, Crown, Globe, MapPin, Calendar, Clock } from "lucide-react"

interface LeaderboardProps {
  currentUser: any
  userStats: any
}

export default function Leaderboard({ currentUser, userStats }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState("global")
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<{
    globalRank: number
    countryRank: number
    stateRank: number
    totalPlayers: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
    loadUserRank()
  }, [activeTab])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      let data: LeaderboardEntry[] = []

      switch (activeTab) {
        case "global":
          data = await getGlobalLeaderboard()
          break
        case "country":
          if (userStats?.country) {
            data = await getCountryLeaderboard(userStats.country)
          }
          break
        case "state":
          if (userStats?.country && userStats?.state) {
            data = await getStateLeaderboard(userStats.country, userStats.state)
          }
          break
        case "daily":
          data = await getDailyLeaderboard()
          break
        case "weekly":
          data = await getWeeklyLeaderboard()
          break
      }

      setLeaderboardData(data)
    } catch (error) {
      console.error("Error loading leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserRank = async () => {
    if (currentUser?.id) {
      try {
        const rank = await getUserRank(currentUser.id)
        setUserRank(rank)
      } catch (error) {
        console.error("Error loading user rank:", error)
      }
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500"
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600"
    if (rank <= 10) return "bg-primary"
    return "bg-muted"
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Leaderboards</h1>
        <p className="text-muted-foreground">Compete with players around the world</p>
      </div>

      {/* User Rank Summary */}
      {userRank && (
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Award className="mr-2 h-5 w-5" />
            Your Rankings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">#{userRank.globalRank}</div>
              <div className="text-sm text-muted-foreground">Global Rank</div>
              <div className="text-xs text-muted-foreground">of {userRank.totalPlayers} players</div>
            </div>
            {userStats?.country && userRank.countryRank > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">#{userRank.countryRank}</div>
                <div className="text-sm text-muted-foreground">Country Rank</div>
                <div className="text-xs text-muted-foreground">{userStats.country}</div>
              </div>
            )}
            {userStats?.state && userRank.stateRank > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">#{userRank.stateRank}</div>
                <div className="text-sm text-muted-foreground">State Rank</div>
                <div className="text-xs text-muted-foreground">{userStats.state}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="global" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Global</span>
          </TabsTrigger>
          <TabsTrigger value="country" className="flex items-center gap-1" disabled={!userStats?.country}>
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Country</span>
          </TabsTrigger>
          <TabsTrigger value="state" className="flex items-center gap-1" disabled={!userStats?.state}>
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">State</span>
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Weekly</span>
          </TabsTrigger>
        </TabsList>

        {["global", "country", "state", "daily", "weekly"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold capitalize flex items-center gap-2">
                  {tab === "global" && <Globe className="h-6 w-6" />}
                  {tab === "country" && <MapPin className="h-6 w-6" />}
                  {tab === "state" && <MapPin className="h-6 w-6" />}
                  {tab === "daily" && <Calendar className="h-6 w-6" />}
                  {tab === "weekly" && <Clock className="h-6 w-6" />}
                  {tab} Leaderboard
                </h2>
                <Button variant="outline" size="sm" onClick={loadLeaderboard} disabled={loading}>
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg animate-pulse">
                      <div className="w-8 h-8 bg-muted rounded"></div>
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-muted rounded mb-2"></div>
                        <div className="w-24 h-3 bg-muted rounded"></div>
                      </div>
                      <div className="w-16 h-6 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No players yet</h3>
                  <p className="text-muted-foreground">Be the first to set a score!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboardData.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                        entry.user_id === currentUser?.id
                          ? "bg-primary/10 border-2 border-primary/20"
                          : "bg-card hover:bg-muted/50"
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {entry.rank <= 3 ? (
                          <div className={`p-2 rounded-full ${getRankBadgeColor(entry.rank)}`}>
                            {getRankIcon(entry.rank)}
                          </div>
                        ) : (
                          getRankIcon(entry.rank)
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={entry.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {entry.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{entry.display_name}</h3>
                          {entry.user_id === currentUser?.id && (
                            <Badge variant="secondary" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Level {entry.level}</span>
                          <span>{entry.total_games_played} games</span>
                          {entry.country && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {entry.country}
                              {entry.state && `, ${entry.state}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{entry.score.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
