'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  FileText,
  Network,
  Zap
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface BlockchainValidationStatus {
  electionId: string
  totalVotes: number
  validatedVotes: number
  pendingValidation: number
  invalidVotes: number
  blockchainSynced: boolean
  lastSyncTime: string
  integrityScore: number
}

interface NetworkStatus {
  isConnected: boolean
  blockNumber: number
  gasPrice: string
  networkId: number
  contractAddress: string
}

interface ValidationPanelProps {
  electionId: string
  onAuditGenerated?: (auditData: any) => void
}

export default function BlockchainValidationPanel({ electionId, onAuditGenerated }: ValidationPanelProps) {
  const [validationStatus, setValidationStatus] = useState<BlockchainValidationStatus | null>(null)
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBlockchainAvailable, setIsBlockchainAvailable] = useState(false)

  // Fetch validation status
  const fetchValidationStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/blockchain/validation?action=validation-status&electionId=${electionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch validation status')
      }

      const data = await response.json()
      setValidationStatus(data.validation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch network status
  const fetchNetworkStatus = async () => {
    try {
      const response = await fetch('/api/blockchain/validation?action=network-status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch network status')
      }

      const data = await response.json()
      setNetworkStatus(data.blockchain.network)
      setIsBlockchainAvailable(data.blockchain.available)
    } catch (err) {
      console.error('Failed to fetch network status:', err)
    }
  }

  // Sync blockchain status
  const syncBlockchain = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/blockchain/validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-blockchain',
          electionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to sync blockchain')
      }

      // Refresh validation status after sync
      await fetchValidationStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate audit report
  const generateAuditReport = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/blockchain/validation?action=election-audit&electionId=${electionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate audit report')
      }

      const data = await response.json()
      
      if (onAuditGenerated) {
        onAuditGenerated(data.audit)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit generation failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchValidationStatus()
    fetchNetworkStatus()
  }, [electionId])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchValidationStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [electionId])

  const getIntegrityColor = (score: number) => {
    if (score >= 90) return 'text-blue-600'
    if (score >= 70) return 'text-blue-500'
    return 'text-gray-900'
  }

  const getIntegrityBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-blue-100 text-blue-800">Excellent</Badge>
    if (score >= 70) return <Badge className="bg-blue-50 text-blue-700">Good</Badge>
    return <Badge className="bg-gray-100 text-gray-800">Needs Attention</Badge>
  }

  if (!isBlockchainAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Blockchain Validation
          </CardTitle>
          <CardDescription>
            Cryptographic vote validation and integrity verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Blockchain validation service is not available. Votes are still recorded securely in the database with cryptographic hashes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Validation Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Blockchain Validation Status
          </CardTitle>
          <CardDescription>
            Real-time vote integrity and blockchain validation monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validationStatus && (
            <>
              {/* Integrity Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Integrity Score</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getIntegrityColor(validationStatus.integrityScore)}`}>
                      {validationStatus.integrityScore}%
                    </span>
                    {getIntegrityBadge(validationStatus.integrityScore)}
                  </div>
                </div>
                <Progress 
                  value={validationStatus.integrityScore} 
                  className="h-2"
                />
              </div>

              {/* Vote Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationStatus.totalVotes}
                  </div>
                  <div className="text-sm text-blue-800">Total Votes</div>
                </div>
                
                <div className="text-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                  <div className="text-2xl font-bold text-gray-900">
                    {validationStatus.validatedVotes}
                  </div>
                  <div className="text-sm text-gray-700">Validated</div>
                </div>
                
                <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-300">
                  <div className="text-2xl font-bold text-blue-700">
                    {validationStatus.pendingValidation}
                  </div>
                  <div className="text-sm text-blue-600">Pending</div>
                </div>
                
                <div className="text-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="text-2xl font-bold text-white">
                    {validationStatus.invalidVotes}
                  </div>
                  <div className="text-sm text-gray-300">Invalid</div>
                </div>
              </div>

              {/* Blockchain Sync Status */}
              <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded-lg">
                <div className="flex items-center gap-2">
                  {validationStatus.blockchainSynced ? (
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-400" />
                  )}
                  <span className="font-medium">
                    Blockchain Sync: {validationStatus.blockchainSynced ? 'Up to date' : 'Sync needed'}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  Last sync: {formatDateTime(validationStatus.lastSyncTime)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={syncBlockchain} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync Blockchain
                </Button>
                
                <Button 
                  onClick={generateAuditReport} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Audit Report
                </Button>
                
                <Button 
                  onClick={fetchValidationStatus} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              </div>
            </>
          )}

          {!validationStatus && !error && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading validation status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Status Card */}
      {networkStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Blockchain Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Connection</div>
                <div className="flex items-center gap-2">
                  {networkStatus.isConnected ? (
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-gray-900" />
                  )}
                  <span className="font-medium">
                    {networkStatus.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Block Number</div>
                <div className="font-mono text-sm text-blue-600">
                  #{networkStatus.blockNumber.toString()}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Gas Price</div>
                <div className="font-mono text-sm text-blue-600">
                  {networkStatus.gasPrice} Gwei
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Network ID</div>
                <div className="font-mono text-sm text-blue-600">
                  {networkStatus.networkId}
                </div>
              </div>
            </div>
            
            {networkStatus.contractAddress && (
              <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-300 mb-1">Contract Address</div>
                <div className="font-mono text-xs break-all text-blue-400">
                  {networkStatus.contractAddress}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 