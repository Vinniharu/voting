import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

// Shared in-memory user storage (replace with database in production)
export interface User {
  id: string
  fullName: string
  email: string
  password: string
  createdAt: Date
}

export interface Candidate {
  id: string
  name: string
  description: string
}

export interface Vote {
  id: string
  candidateId?: string
  candidateIds?: string[]
  voterEmail?: string
  timestamp: Date
}

export interface Election {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  candidates: string[]
  votingPolicy: 'one-vote' | 'multiple-votes'
  requiresRegistration: boolean
  creatorId: string
  createdAt: string
  voteCount: number
  status: 'draft' | 'active' | 'ended'
  votes: Array<{
    id: string
    candidateIds: string[]
    voterEmail: string
    createdAt: string
  }>
}

interface UserState {
  user: User | null
  elections: Election[]
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (fullName: string, email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  fetchProfile: () => Promise<void>
  fetchElections: () => Promise<void>
  createElection: (election: Omit<Election, 'id' | 'creatorId' | 'createdAt' | 'voteCount' | 'votes'>) => Promise<boolean>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      elections: [],
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (response.ok) {
            const userData = await response.json()
            set({ user: userData.user, isLoading: false })
            return true
          } else {
            set({ isLoading: false })
            return false
          }
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          return false
        }
      },

      register: async (fullName: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          console.log('Attempting registration with:', { fullName, email })
          
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fullName, email, password }),
          })

          console.log('Response status:', response.status)
          console.log('Response ok:', response.ok)
          
          if (response.ok) {
            const userData = await response.json()
            console.log('Registration successful:', userData)
            set({ user: userData.user, isLoading: false })
            return true
          } else {
            // Log the actual error response
            let errorData
            try {
              errorData = await response.json()
              console.error('Registration failed with JSON error:', errorData)
              
              // Show specific error message from server
              if (errorData.error) {
                // You can access the error message with: errorData.error
                console.error('Server error message:', errorData.error)
              }
            } catch (parseError) {
              console.error('Failed to parse error response as JSON:', parseError)
              const textResponse = await response.text()
              console.error('Raw error response:', textResponse)
              errorData = { error: `Server error: ${response.status} ${response.statusText}` }
            }
            set({ isLoading: false })
            return false
          }
        } catch (error) {
          console.error('Registration network/fetch error:', error)
          set({ isLoading: false })
          return false
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          })
          set({ user: null, elections: [] })
        } catch (error) {
          console.error('Logout error:', error)
          // Still clear the local state even if the API call fails
          set({ user: null, elections: [] })
        }
      },

      fetchProfile: async () => {
        try {
          const response = await fetch('/api/auth/me')
          if (response.ok) {
            const userData = await response.json()
            set({ user: userData.user })
          } else {
            set({ user: null })
          }
        } catch (error) {
          console.error('Fetch profile error:', error)
          set({ user: null })
        }
      },

      fetchElections: async () => {
        try {
          const response = await fetch('/api/elections')
          if (response.ok) {
            const electionsData = await response.json()
            set({ elections: electionsData })
          }
        } catch (error) {
          console.error('Fetch elections error:', error)
        }
      },

      createElection: async (electionData) => {
        try {
          const response = await fetch('/api/elections', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(electionData),
          })

          if (response.ok) {
            // Refresh elections list
            await get().fetchElections()
            return true
          }
          return false
        } catch (error) {
          console.error('Create election error:', error)
          return false
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// These functions were removed as they referenced a non-existent users array
// User management is now handled through Supabase directly 