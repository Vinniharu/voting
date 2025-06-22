'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Users, Vote, Trophy, Calendar, Clock } from 'lucide-react'
import { formatDateWithTime } from '@/lib/utils'

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
  status: 'draft' | 'active' | 'ended'
}

interface VoteResult {
  candidateId: string
  candidateName: string
  voteCount: number
  percentage: number
}

interface ResultsData {
  election: Election
  results: VoteResult[]
  totalVotes: number
}

export default function ElectionResultsPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string

  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchResults()
  }, [electionId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}/results`)
      
      if (response.ok) {
        const data = await response.json()
        setResultsData(data)
      } else {
        setError('Failed to load election results')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

  const getWinner = (results: VoteResult[]) => {
    if (results.length === 0) return null
    return results.reduce((prev, current) => 
      prev.voteCount > current.voteCount ? prev : current
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !resultsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">Results Not Available</h2>
            <p className="text-slate-300 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { election, results, totalVotes } = resultsData
  const statusInfo = getStatusInfo(election.status)
  const StatusIcon = statusInfo.icon
  const winner = getWinner(results)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-300 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Election Info */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white">{election.title}</CardTitle>
                <CardDescription className="text-slate-300 mt-2">
                  {election.description}
                </CardDescription>
              </div>
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusInfo.text}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Started: {formatDateWithTime(election.startDate)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Ends: {formatDateWithTime(election.endDate)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Total Votes: {totalVotes}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Winner Card */}
        {winner && totalVotes > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Leading Candidate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{winner.candidateName}</h3>
                  <p className="text-slate-300">{winner.voteCount} votes ({winner.percentage.toFixed(1)}%)</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{winner.percentage.toFixed(1)}%</div>
                  <div className="text-sm text-slate-400">of total votes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Election Results
            </CardTitle>
            <CardDescription className="text-slate-300">
              {totalVotes === 0 ? 'No votes cast yet' : `${totalVotes} total votes cast`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalVotes === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No Votes Yet</h3>
                <p className="text-slate-400">
                  Results will appear here once voting begins.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results
                  .sort((a, b) => b.voteCount - a.voteCount)
                  .map((result, index) => (
                    <div
                      key={result.candidateId}
                      className="p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-gray-400 text-black' : 
                            index === 2 ? 'bg-orange-600 text-white' : 
                            'bg-slate-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{result.candidateName}</h4>
                            <p className="text-sm text-slate-400">
                              {result.voteCount} votes • {result.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{result.voteCount}</div>
                          <div className="text-sm text-slate-400">{result.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      <Progress 
                        value={result.percentage} 
                        className="h-2 bg-slate-600"
                      />
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          <Button
            onClick={() => router.push(`/vote/${electionId}`)}
            disabled={election.status !== 'active'}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Vote className="h-4 w-4 mr-2" />
            {election.status === 'active' ? 'Vote Now' : 'Voting Closed'}
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            View All Elections
          </Button>
        </div>
      </div>
    </div>
  )
} 