'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Users, 
  BarChart3, 
  ExternalLink, 
  Copy, 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useUserStore, Election, Candidate } from '@/lib/userStore'
import BlockchainValidationPanel from '@/components/BlockchainValidationPanel'
import { formatDateWithTime } from '@/lib/utils'

export default function ElectionDetailsPage() {
  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [auditData, setAuditData] = useState<any>(null)
  
  const router = useRouter()
  const params = useParams()
  const electionId = params.id as string
  
  const { user, fetchProfile } = useUserStore()

  useEffect(() => {
    // Only fetch profile if no user is persisted
    if (user === null) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  useEffect(() => {
    if (user === null) {
      router.push('/login')
      return
    }

    if (user && electionId) {
      fetchElectionDetails()
    }
  }, [user, electionId])

  const fetchElectionDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch election details
      const electionResponse = await fetch(`/api/elections/${electionId}`)
      if (!electionResponse.ok) {
        throw new Error('Failed to fetch election details')
      }
      
      const electionData = await electionResponse.json()
      setElection(electionData.election)
      setCandidates(electionData.candidates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load election')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'ended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'ended': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }



  const generateVotingLink = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/vote/${electionId}`
  }

  const copyVotingLink = async () => {
    const link = generateVotingLink()
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleAuditGenerated = (audit: any) => {
    setAuditData(audit)
    // You could also open a modal or navigate to a detailed audit view
    console.log('Audit report generated:', audit)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading election details...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={fetchElectionDetails}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Don't render if no election data
  if (!election) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(election.status)}>
                    {getStatusIcon(election.status)}
                    <span className="ml-1">{election.status}</span>
                  </Badge>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{election.voteCount} votes cast</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/elections/${electionId}/results`)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Results
              </Button>
              <Button
                variant="outline"
                onClick={copyVotingLink}
              >
                {copiedLink ? (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Copy Voting Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Election Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Election Information */}
            <Card>
              <CardHeader>
                <CardTitle>Election Details</CardTitle>
                <CardDescription>
                  Basic information about this election
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{election.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Start Date</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {formatDateWithTime(election.startDate)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">End Date</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {formatDateWithTime(election.endDate)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Voting Link</h3>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <code className="flex-1 text-sm text-gray-600 break-all">
                      {generateVotingLink()}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyVotingLink}>
                      {copiedLink ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Candidates ({candidates.length})
                </CardTitle>
                <CardDescription>
                  List of candidates in this election
                </CardDescription>
              </CardHeader>
              <CardContent>
                {candidates.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No candidates added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidates.map((candidate, index) => (
                      <div key={candidate.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                          {candidate.description && (
                            <p className="text-sm text-gray-600">{candidate.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">0</div>
                          <div className="text-sm text-gray-600">votes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Report Display */}
            {auditData && (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Audit Report</CardTitle>
                  <CardDescription>
                    Blockchain validation audit results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {auditData.summary?.totalVotes || 0}
                        </div>
                        <div className="text-sm text-blue-800">Total Votes</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {auditData.summary?.validatedVotes || 0}
                        </div>
                        <div className="text-sm text-green-800">Validated</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {auditData.summary?.pendingValidation || 0}
                        </div>
                        <div className="text-sm text-yellow-800">Pending</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {auditData.summary?.integrityScore || 0}%
                        </div>
                        <div className="text-sm text-purple-800">Integrity</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Report generated: {formatDateWithTime(auditData.timestamp)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Blockchain Validation */}
          <div className="lg:col-span-1">
            <BlockchainValidationPanel 
              electionId={electionId}
              onAuditGenerated={handleAuditGenerated}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 