"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"

interface UserProfile {
  id: string
  name: string | null
  email: string
  role: string
  image: string | null
  createdAt: string
  emailVerified: string | null
}

export default function UserProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    image: ''
  })

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/me')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
      setFormData({
        name: data.name || '',
        image: data.image || ''
      })
    } catch (error) {
      toast.error('Failed to load profile')
    }
  }

  // Update profile
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to update profile')
      
      const data = await res.json()
      setProfile(data)
      toast.success('Profile updated successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  // Load profile data on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your account settings and profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateProfile} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.image || undefined} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Profile Picture</h4>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Image URL"
                      value={formData.image || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        image: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                />
              </div>

              <div className="grid gap-2">
                <Label>Role</Label>
                <Input
                  value={profile.role}
                  disabled
                />
              </div>

              <div className="grid gap-2">
                <Label>Member Since</Label>
                <Input
                  value={new Date(profile.createdAt).toLocaleDateString()}
                  disabled
                />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
