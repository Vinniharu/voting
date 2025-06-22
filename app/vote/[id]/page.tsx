'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Vote, CheckCircle, Clock, Users, Mail } from 'lucide-react'

interface Candidate {
  id: string
  name: string
  description?: string
}

interface Election {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  candidates: Candidate[]
  allowMultipleVotes: boolean
  requireVoterRegistration: boolean
  status: 'draft' | 'active' | 'ended'
}

interface VoteData {
  candidateIds: string[]
  voterEmail: string
}

export default function VotePage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string

  const [election, setElection] = useState<Election | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voteData, setVoteData] = useState<VoteData>({
    candidateIds: [],
    voterEmail: ''
  })
  const [error, setError] = useState<string>('')
  const [voteSubmitted, setVoteSubmitted] = useState(false)

  useEffect(() => {
    fetchElection()
  }, [electionId])

  const fetchElection = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}`)
      
      if (response.ok) {
        const data = await response.json()
        setElection(data.election)
      } else {
        setError('Election not found or no longer available')
      }
    } catch (error) {
      setError('Failed to load election. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCandidateSelection = (candidateId: string, checked: boolean) => {
    if (!election) return

    if (election.allowMultipleVotes) {
      // Multiple votes allowed - use checkboxes
      setVoteData(prev => ({
        ...prev,
        candidateIds: checked
          ? [...prev.candidateIds, candidateId]
          : prev.candidateIds.filter(id => id !== candidateId)
      }))
    } else {
      // Single vote only - use radio
      setVoteData(prev => ({
        ...prev,
        candidateIds: [candidateId]
      }))
    }
    setError('') // Clear error when selection changes
  }

  const handleSubmitVote = async () => {
    // Simple validation
    if (voteData.candidateIds.length === 0) {
      setError('Please select at least one candidate')
      return
    }

    if (election?.requireVoterRegistration && !voteData.voterEmail) {
      setError('Email is required for this election')
      return
    }

    if (election?.requireVoterRegistration && voteData.voterEmail) {
      const emailRegex = /\S+@\S+\.\S+/
      if (!emailRegex.test(voteData.voterEmail)) {
        setError('Please enter a valid email address')
        return
      }
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/elections/${electionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      })

      const data = await response.json()

      if (response.ok) {
        setVoteSubmitted(true)
      } else {
        setError(data.error || 'Failed to submit vote. Please try again.')
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: Vote, text: 'Active' }
      case 'ended':
        return { color: 'bg-red-100 text-red-800', icon: Clock, text: 'Ended' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Draft' }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white text-sm sm:text-base">Loading election...</p>
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-red-400 text-4xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Election Not Found</h2>
            <p className="text-slate-300 mb-4 text-sm sm:text-base">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full sm:w-auto">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (voteSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 sm:p-6 text-center">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2">Vote Submitted!</h2>
            <p className="text-slate-300 mb-4 text-sm sm:text-base">
              Thank you for participating in "{election.title}". Your vote has been recorded successfully.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(election.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Election Header */}
        <Card className="mb-4 sm:mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl sm:text-2xl text-white leading-tight">{election.title}</CardTitle>
                <CardDescription className="text-slate-300 mt-2 text-sm sm:text-base">
                  {election.description}
                </CardDescription>
              </div>
              <Badge className={`${statusInfo.color} self-start`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusInfo.text}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400 mt-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="truncate">Ends: {formatDate(election.endDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {election.candidates.length} candidates
              </div>
              {election.allowMultipleVotes && (
                <div className="flex items-center gap-1">
                  <Vote className="h-4 w-4" />
                  Multiple votes allowed
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Voting Form */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              <Vote className="h-5 w-5" />
              Cast Your Vote
            </CardTitle>
            <CardDescription className="text-slate-300 text-sm sm:text-base">
              {election.allowMultipleVotes 
                ? 'Select one or more candidates' 
                : 'Select one candidate'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Email Input (if required) */}
            {election.requireVoterRegistration && (
              <div className="space-y-2">
                <Label htmlFor="voterEmail" className="text-slate-200 flex items-center gap-2 text-sm sm:text-base">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="voterEmail"
                  type="email"
                  placeholder="Enter your email address"
                  value={voteData.voterEmail}
                  onChange={(e) => setVoteData(prev => ({ ...prev, voterEmail: e.target.value }))}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
            )}

            {/* Candidate Selection */}
            <div className="space-y-3">
              <Label className="text-slate-200 text-sm sm:text-base">Choose your candidate(s):</Label>
              <div className="space-y-2">
                {election.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                      voteData.candidateIds.includes(candidate.id)
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                    onClick={() => handleCandidateSelection(
                      candidate.id, 
                      !voteData.candidateIds.includes(candidate.id)
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type={election.allowMultipleVotes ? 'checkbox' : 'radio'}
                        name="candidate"
                        checked={voteData.candidateIds.includes(candidate.id)}
                        onChange={() => {}} // Handled by onClick above
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm sm:text-base">{candidate.name}</div>
                        {candidate.description && (
                          <div className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">{candidate.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmitVote}
                disabled={isSubmitting || voteData.candidateIds.length === 0 || election.status !== 'active'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
                size="lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting Vote...
                  </div>
                ) : election.status !== 'active' ? (
                  'Election Not Active'
                ) : (
                  <div className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Submit Vote
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 