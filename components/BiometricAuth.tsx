'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Scan, CheckCircle, XCircle, Camera, Shield, AlertTriangle, Video } from 'lucide-react'

interface BiometricAuthProps {
  onAuthSuccess: () => void
  onAuthCancel: () => void
  isOpen: boolean
}

export default function BiometricAuth({ onAuthSuccess, onAuthCancel, isOpen }: BiometricAuthProps) {
  const [authState, setAuthState] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'failed' | 'camera-permission'>('idle')
  const [scanProgress, setScanProgress] = useState(0)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isOpen) {
      setAuthState('camera-permission')
      setScanProgress(0)
      setCameraError('')
      initializeCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Use front-facing camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setAuthState('idle')
    } catch (error) {
      console.error('Camera access error:', error)
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera access denied. Please allow camera permissions and try again.')
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera found on this device.')
        } else {
          setCameraError('Unable to access camera. Please check your device settings.')
        }
      } else {
        setCameraError('Camera access failed. Please try again.')
      }
      setAuthState('failed')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const startScan = () => {
    setAuthState('scanning')
    setScanProgress(0)
    
    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setAuthState('processing')
          
          // Simulate processing time
          setTimeout(() => {
            // 85% success rate for realism
            const success = Math.random() > 0.15
            if (success) {
              setAuthState('success')
              setTimeout(() => {
                onAuthSuccess()
              }, 1500)
            } else {
              setAuthState('failed')
              // Auto close after showing failure
              setTimeout(() => {
                onAuthCancel()
              }, 3000)
            }
          }, 1500)
          return 100
        }
        return prev + 2
      })
    }, 50)
  }

  if (!isOpen) return null

  const renderContent = () => {
    switch (authState) {
      case 'camera-permission':
        return (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto border-4 border-blue-500 rounded-full flex items-center justify-center bg-blue-500/10">
              <Video className="h-16 w-16 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Requesting Camera Access</h3>
              <p className="text-slate-300 text-sm">
                Please allow camera access to proceed with Face ID authentication
              </p>
            </div>
          </div>
        )

      case 'idle':
        return (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-48 h-48 mx-auto border-4 border-blue-500 rounded-full overflow-hidden bg-blue-500/10">
                {cameraStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]" // Mirror the video
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-16 w-16 text-blue-400" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 w-48 h-48 mx-auto border-4 border-transparent rounded-full animate-pulse">
                <div className="w-full h-full border-4 border-blue-400 border-t-transparent rounded-full animate-spin opacity-60"></div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Face ID Ready</h3>
              <p className="text-slate-300 text-sm">
                Position your face within the frame and tap to begin scan
              </p>
            </div>
            <Button
              onClick={startScan}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={!cameraStream}
            >
              <Scan className="mr-2 h-5 w-5" />
              Start Face ID Scan
            </Button>
          </div>
        )

      case 'scanning':
        return (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-48 h-48 mx-auto border-4 border-green-500 rounded-full overflow-hidden bg-blue-500/10">
                {cameraStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]" // Mirror the video
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-16 w-16 text-blue-400" />
                  </div>
                )}
                {/* Scanning overlay */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-green-500/30 transition-all duration-100"
                  style={{ height: `${scanProgress}%` }}
                />
              </div>
              <div className="absolute inset-0 w-48 h-48 mx-auto">
                {/* Scanning grid lines */}
                <div className="w-full h-0.5 bg-green-400 absolute animate-pulse opacity-80" style={{ top: `${scanProgress}%` }} />
                <div className="w-full h-0.5 bg-green-400 absolute animate-pulse opacity-60" style={{ top: `${Math.max(0, scanProgress - 10)}%` }} />
                <div className="w-full h-0.5 bg-green-400 absolute animate-pulse opacity-40" style={{ top: `${Math.max(0, scanProgress - 20)}%` }} />
                
                {/* Corner brackets for Face ID feel */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-green-400"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-green-400"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-green-400"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-green-400"></div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Scanning Face...</h3>
              <p className="text-slate-300 text-sm">
                Keep your face steady and look directly at the camera
              </p>
              <div className="mt-4">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-slate-400 text-xs mt-2">{scanProgress}% complete</p>
              </div>
            </div>
          </div>
        )

      case 'processing':
        return (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto border-4 border-yellow-500 rounded-full flex items-center justify-center bg-yellow-500/10">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Processing Biometric Data</h3>
              <p className="text-slate-300 text-sm">
                Verifying your identity against secure database...
              </p>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto border-4 border-green-500 rounded-full flex items-center justify-center bg-green-500/10">
              <CheckCircle className="h-16 w-16 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Authentication Successful</h3>
              <p className="text-slate-300 text-sm">
                Face ID verification complete. Redirecting to voting...
              </p>
            </div>
          </div>
        )

      case 'failed':
        return (
          <div className="text-center space-y-6">
            <div className="w-48 h-48 mx-auto border-4 border-red-500 rounded-full flex items-center justify-center bg-red-500/10">
              <XCircle className="h-16 w-16 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {cameraError ? 'Camera Error' : 'Authentication Failed'}
              </h3>
              <p className="text-slate-300 text-sm">
                {cameraError || 'Face not recognized. Authentication failed.'}
              </p>
              {cameraError ? (
                <Button
                  onClick={initializeCamera}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Video className="mr-2 h-4 w-4" />
                                     Try Camera Again
                 </Button>
               ) : (
                 <p className="text-slate-400 text-xs mt-2">
                   Closing automatically...
                 </p>
               )}
             </div>
           </div>
         )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-slate-800/95 border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-white">
            <Shield className="h-6 w-6 text-blue-400" />
            Secure Voter Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          {renderContent()}
          
          {(authState === 'idle' || authState === 'camera-permission' || authState === 'failed') && (
            <div className="mt-6 pt-4 border-t border-slate-700">
              <Button
                onClick={onAuthCancel}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel Voting
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 