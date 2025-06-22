'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Users, BarChart3, ExternalLink, Copy } from 'lucide-react'
import CreateElectionModal from '@/components/CreateElectionModal'
import { useUserStore, Election } from '@/lib/userStore'

export default function Dashboard() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const router = useRouter()
  
  const { user, elections, logout, fetchProfile, fetchElections } = useUserStore()

  useEffect(() => {
    // Fetch user profile on mount
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (user === null) {
      router.push('/login')
      return
    }

    // Fetch elections when user is available
    if (user) {
      fetchElections()
    }
  }, [user, router, fetchElections])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'ended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateVotingLink = (electionId: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/vote/${electionId}`
  }

  const copyVotingLink = async (electionId: string) => {
    const link = generateVotingLink(electionId)
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(electionId)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleElectionCreated = () => {
    fetchElections() // Refresh the elections list
  }

  // Show loading state while checking authentication
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if user is null (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-blue-900">
      {/* Header */}
      <div className="bg-blue-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-600">Election Dashboard</h1>
              <p className="text-gray-200">Welcome back, {user.fullName}</p>
            </div>
            <div className="flex items-center gap-4">
              <CreateElectionModal onElectionCreated={handleElectionCreated} />
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Elections</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{elections.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Elections</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {elections.filter((e: Election) => e.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {elections.reduce((sum: number, e: Election) => sum + e.voteCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Elections List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Elections</CardTitle>
            <CardDescription>
              Manage and monitor your created elections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {elections.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No elections yet</h3>
                <p className="text-gray-600 mb-4">Create your first election to get started</p>
                <CreateElectionModal onElectionCreated={handleElectionCreated} />
              </div>
            ) : (
              <div className="space-y-4">
                {elections.map((election: Election) => (
                  <div key={election.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{election.title}</h3>
                          <Badge className={getStatusColor(election.status)}>
                            {election.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{election.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Start:</span>
                            <div className="text-gray-600">{formatDate(election.startDate)}</div>
                          </div>
                          <div>
                            <span className="font-medium">End:</span>
                            <div className="text-gray-600">{formatDate(election.endDate)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Candidates:</span>
                            <div className="text-gray-600">{election.candidates.length}</div>
                          </div>
                          <div>
                            <span className="font-medium">Votes:</span>
                            <div className="text-gray-600">{election.voteCount}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/elections/${election.id}`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/elections/${election.id}/results`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyVotingLink(election.id)}
                        >
                          {copiedLink === election.id ? (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Copy Link
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 