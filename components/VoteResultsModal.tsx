'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, BarChart3 } from 'lucide-react'

interface VoteResult {
  candidateId: string
  candidateName: string
  description: string
  voteCount: number
  percentage: number
}

interface Election {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: string
  voteCount: number
}

interface VoteResultsModalProps {
  isOpen: boolean
  onClose: () => void
  electionId: string | null
}

export default function VoteResultsModal({ isOpen, onClose, electionId }: VoteResultsModalProps) {
  const [results, setResults] = useState<VoteResult[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [winner, setWinner] = useState<VoteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && electionId) {
      // Reset state when opening
      setResults([])
      setElection(null)
      setTotalVotes(0)
      setWinner(null)
      setError(null)
      
      fetchVoteResults()
    }
  }, [isOpen, electionId])

  const fetchVoteResults = async () => {
    if (!electionId) return

    setLoading(true)
    setError(null)

    try {
      console.log('Fetching vote results for election:', electionId)
      const response = await fetch(`/api/elections/${electionId}/results`)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        throw new Error(`Failed to fetch vote results: ${response.status}`)
      }

      const data = await response.json()
      console.log('Vote results data:', data)
      
      setResults(data.results || [])
      setElection(data.election)
      setTotalVotes(data.totalVotes || 0)
      setWinner(data.winner || null)
    } catch (error) {
      console.error('Error fetching vote results:', error)
      setError('Failed to load vote results. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'ended': return 'bg-red-500'
      case 'draft': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Vote Results
          </DialogTitle>
          <DialogDescription>
            Real-time voting results and statistics
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-center py-4">
            {error}
          </div>
        )}

        {election && !loading && !error && (
          <div className="space-y-6">
            {/* Election Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{election.title}</CardTitle>
                    <CardDescription>{election.description}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(election.status)}>
                    {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Start Date</div>
                    <div className="font-medium">{formatDate(election.startDate)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">End Date</div>
                    <div className="font-medium">{formatDate(election.endDate)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Votes</div>
                    <div className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {totalVotes}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Winner Announcement */}
            {winner && totalVotes > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Trophy className="h-5 w-5" />
                    Current Leader
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg text-yellow-900">{winner.candidateName}</div>
                      {winner.description && (
                        <div className="text-sm text-yellow-700">{winner.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-900">{winner.voteCount}</div>
                      <div className="text-sm text-yellow-700">{winner.percentage}% of votes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Results</CardTitle>
                <CardDescription>Vote breakdown by candidate</CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No votes cast yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div key={result.candidateId} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.candidateName}</span>
                            {index === 0 && totalVotes > 0 && (
                              <Trophy className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{result.voteCount}</span>
                            <span className="text-gray-500 ml-1">({result.percentage}%)</span>
                          </div>
                        </div>
                        <Progress 
                          value={result.percentage} 
                          className="h-2"
                        />
                        {result.description && (
                          <div className="text-sm text-gray-600 ml-2">{result.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={fetchVoteResults}>
                Refresh Results
              </Button>
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 