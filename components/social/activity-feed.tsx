"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Users, Target, Share2, TrendingUp } from "lucide-react"
import { getActivityFeed, type ActivityItem } from "@/lib/social-actions"

interface ActivityFeedProps {
  currentUser: any
}

export default function ActivityFeed({ currentUser }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivityFeed()
  }, [currentUser.id])

  const loadActivityFeed = async () => {
    setLoading(true)
    try {
      const data = await getActivityFeed(currentUser.id)
      setActivities(data)
    } catch (error) {
      console.error("Error loading activity feed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "high_score":
        return <Trophy className="h-5 w-5 text-primary" />
      case "achievement":
        return <Star className="h-5 w-5 text-secondary" />
      case "friend_added":
        return <Users className="h-5 w-5 text-accent" />
      case "challenge_sent":
        return <Target className="h-5 w-5 text-chart-3" />
      case "score_shared":
        return <Share2 className="h-5 w-5 text-chart-4" />
      case "level_up":
        return <TrendingUp className="h-5 w-5 text-chart-5" />
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    const { activity_type, activity_data } = activity
    const userName = activity.user.display_name || activity.user.username

    switch (activity_type) {
      case "high_score":
        return `${userName} achieved a new high score of ${activity_data.score?.toLocaleString()} points!`
      case "achievement":
        return `${userName} unlocked the "${activity_data.achievement_name}" achievement!`
      case "friend_added":
        return `${userName} made a new friend!`
      case "challenge_sent":
        return `${userName} challenged ${activity_data.challenged_username} to beat ${activity_data.target_score?.toLocaleString()} points!`
      case "score_shared":
        return `${userName} shared their score of ${activity_data.score?.toLocaleString()} points!`
      case "level_up":
        return `${userName} reached level ${activity_data.level}!`
      default:
        return `${userName} had some activity`
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Activity Feed</h1>
        <p className="text-muted-foreground">See what your friends are up to</p>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="w-3/4 h-4 bg-muted rounded mb-2"></div>
                  <div className="w-1/4 h-3 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No activity yet</h3>
            <p className="text-muted-foreground">Add friends to see their achievements and scores!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.user.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {(activity.user.display_name || activity.user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.activity_type)}</div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{getActivityText(activity)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(activity.created_at)}</p>
                    </div>
                  </div>

                  {/* Additional activity data display */}
                  {activity.activity_type === "high_score" && activity.activity_data.level && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Level {activity.activity_data.level}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
