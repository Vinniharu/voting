"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUserStore } from '@/lib/userStore'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  
  const { user, register, isLoading } = useUserStore()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Password validation helpers
  const getPasswordValidation = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    }
  }

  const validation = getPasswordValidation(password)
  const isPasswordValid = validation.length && validation.uppercase && validation.lowercase && validation.number

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Client-side validation
    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (!isPasswordValid) {
      setError('Password must meet all requirements listed below')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const success = await register(fullName.trim(), email.trim(), password)
      
      if (success) {
        setSuccess('Account created successfully! Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError('Registration failed. Please check your information and try again.')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
              
              {/* Password Requirements */}
              {password && (
                <div className="text-xs space-y-1 mt-2">
                  <div className="font-medium text-gray-700">Password must contain:</div>
                  <div className={`flex items-center gap-1 ${validation.length ? 'text-green-600' : 'text-red-600'}`}>
                    {validation.length ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-1 ${validation.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                    {validation.uppercase ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${validation.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                    {validation.lowercase ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    One lowercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${validation.number ? 'text-green-600' : 'text-red-600'}`}>
                    {validation.number ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    One number
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={isLoading}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <XCircle className="w-3 h-3" />
                  Passwords do not match
                </div>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 text-green-800 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !isPasswordValid || password !== confirmPassword}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => router.push('/login')}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

