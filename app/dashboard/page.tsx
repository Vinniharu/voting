'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Users, BarChart3, ExternalLink, Copy } from 'lucide-react'
import CreateElectionModal from '@/components/CreateElectionModal'
import VoteResultsModal from '@/components/VoteResultsModal'
import { useUserStore, Election } from '@/lib/userStore'
import { formatDateTime } from '@/lib/utils'

export default function Dashboard() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [voteResultsModal, setVoteResultsModal] = useState<{ isOpen: boolean; electionId: string | null }>({
    isOpen: false,
    electionId: null
  })
  const router = useRouter()
  
  const { user, elections, logout, fetchProfile, fetchElections } = useUserStore()

  useEffect(() => {
    // Only fetch profile if no user is persisted
    if (user === null) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Redirect to login if not authenticated and profile fetch completed
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-600">Election Dashboard</h1>
              <p className="text-gray-200 text-sm sm:text-base">Welcome back, {user.fullName}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <CreateElectionModal onElectionCreated={handleElectionCreated} />
              <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
          <Card className="sm:col-span-2 lg:col-span-1">
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
            <CardTitle className="text-lg sm:text-xl">Your Elections</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Manage and monitor your created elections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {elections.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No elections yet</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">Create your first election to get started</p>
                <CreateElectionModal onElectionCreated={handleElectionCreated} />
              </div>
            ) : (
              <div className="space-y-4">
                {elections.map((election: Election) => (
                  <div key={election.id} className="border rounded-lg p-4 hover:bg-blue-950">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg">{election.title}</h3>
                          <Badge className={getStatusColor(election.status)}>
                            {election.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3 text-sm sm:text-base">{election.description}</p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                          <div>
                            <span className="font-medium">Start:</span>
                            <div className="text-gray-600 text-xs sm:text-sm">{formatDateTime(election.startDate)}</div>
                          </div>
                          <div>
                            <span className="font-medium">End:</span>
                            <div className="text-gray-600 text-xs sm:text-sm">{formatDateTime(election.endDate)}</div>
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
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVoteResultsModal({ isOpen: true, electionId: election.id })}
                          className="text-xs sm:text-sm"
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">View Votes</span>
                          <span className="sm:hidden">Votes</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyVotingLink(election.id)}
                          className="text-xs sm:text-sm"
                        >
                          {copiedLink === election.id ? (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Copied!</span>
                              <span className="sm:hidden">✓</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Copy Link</span>
                              <span className="sm:hidden">Link</span>
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

      {/* Vote Results Modal */}
      <VoteResultsModal
        isOpen={voteResultsModal.isOpen}
        onClose={() => setVoteResultsModal({ isOpen: false, electionId: null })}
        electionId={voteResultsModal.electionId}
      />
    </div>
  )
} 