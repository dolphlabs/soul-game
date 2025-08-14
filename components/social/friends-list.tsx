"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Check, X, Users, Clock, Trophy } from "lucide-react"
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getFriendRequests,
  type Friend,
} from "@/lib/social-actions"
import { toast } from "@/hooks/use-toast"

interface FriendsListProps {
  currentUser: any
}

export default function FriendsList({ currentUser }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<Friend[]>([])
  const [newFriendUsername, setNewFriendUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState(false)

  useEffect(() => {
    loadFriendsData()
  }, [currentUser.id])

  const loadFriendsData = async () => {
    setLoading(true)
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(currentUser.id),
        getFriendRequests(currentUser.id),
      ])
      setFriends(friendsData)
      setFriendRequests(requestsData)
    } catch (error) {
      console.error("Error loading friends data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFriendUsername.trim()) return

    setSendingRequest(true)
    try {
      const result = await sendFriendRequest(newFriendUsername.trim())
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Friend request sent!",
        })
        setNewFriendUsername("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      })
    } finally {
      setSendingRequest(false)
    }
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const result = await acceptFriendRequest(friendshipId)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Friend request accepted!",
        })
        loadFriendsData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      })
    }
  }

  const getLastPlayedText = (lastPlayed?: string) => {
    if (!lastPlayed) return "Never played"
    const date = new Date(lastPlayed)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Friends</h1>
        <p className="text-muted-foreground">Connect with other players and compete together</p>
      </div>

      {/* Add Friend Form */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Add Friend
        </h2>
        <form onSubmit={handleSendFriendRequest} className="flex gap-2">
          <Input
            placeholder="Enter username"
            value={newFriendUsername}
            onChange={(e) => setNewFriendUsername(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={sendingRequest || !newFriendUsername.trim()}>
            {sendingRequest ? "Sending..." : "Send Request"}
          </Button>
        </form>
      </Card>

      {/* Friends Tabs */}
      <Tabs defaultValue="friends">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Requests ({friendRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <Card className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-muted rounded mb-2"></div>
                      <div className="w-24 h-3 bg-muted rounded"></div>
                    </div>
                    <div className="w-20 h-6 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No friends yet</h3>
                <p className="text-muted-foreground">Add some friends to start competing!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-4 p-4 bg-card rounded-lg border">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.friend.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {friend.friend.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{friend.friend.display_name}</h3>
                        <Badge variant="secondary">Level {friend.friend.level}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {friend.friend.best_score.toLocaleString()}
                        </span>
                        <span>{getLastPlayedText(friend.friend.last_played_at)}</span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      Challenge
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-muted rounded mb-2"></div>
                      <div className="w-24 h-3 bg-muted rounded"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-8 bg-muted rounded"></div>
                      <div className="w-16 h-8 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : friendRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No pending requests</h3>
                <p className="text-muted-foreground">Friend requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex items-center space-x-4 p-4 bg-card rounded-lg border">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.friend.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {request.friend.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{request.friend.display_name}</h3>
                        <Badge variant="secondary">Level {request.friend.level}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {request.friend.best_score.toLocaleString()}
                        </span>
                        <span>Sent {new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
