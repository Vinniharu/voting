'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Vote, X } from 'lucide-react'

interface Candidate {
  id: string
  name: string
  description: string
}

interface CreateElectionModalProps {
  onElectionCreated?: () => void
}

export default function CreateElectionModal({ onElectionCreated }: CreateElectionModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    candidates: [
      { id: '1', name: '', description: '' },
      { id: '2', name: '', description: '' }
    ] as Candidate[]
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('') // Clear error when user types
  }

  const handleCandidateChange = (id: string, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.map(candidate =>
        candidate.id === id ? { ...candidate, [field]: value } : candidate
      )
    }))
    setError('') // Clear error when user types
  }

  const addCandidate = () => {
    const newId = (formData.candidates.length + 1).toString()
    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, { id: newId, name: '', description: '' }]
    }))
  }

  const removeCandidate = (id: string) => {
    if (formData.candidates.length > 2) {
      setFormData(prev => ({
        ...prev,
        candidates: prev.candidates.filter(candidate => candidate.id !== id)
      }))
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Election title is required')
      return false
    }

    if (!formData.description.trim()) {
      setError('Election description is required')
      return false
    }

    const validCandidates = formData.candidates.filter(c => c.name.trim())
    if (validCandidates.length < 2) {
      setError('At least 2 candidates with names are required')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setError('')

    try {
      // Filter out candidates without names and clean up data
      const validCandidates = formData.candidates
        .filter(candidate => candidate.name.trim())
        .map(candidate => ({
          id: candidate.id,
          name: candidate.name.trim(),
          description: candidate.description.trim() || ''
        }))

      // Create election data with default values
      const electionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: new Date().toISOString(), // Start immediately
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // End in 7 days
        candidates: validCandidates,
        allowMultipleVotes: false, // Default to single vote
        requireVoterRegistration: false // Default to no registration required
      }

      console.log('Creating election:', electionData)

      const response = await fetch('/api/elections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(electionData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Election created successfully:', data)
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          candidates: [
            { id: '1', name: '', description: '' },
            { id: '2', name: '', description: '' }
          ]
        })
        
        setOpen(false)
        onElectionCreated?.()
      } else {
        console.error('Election creation failed:', data)
        setError(data.error || 'Failed to create election. Please try again.')
      }
    } catch (error) {
      console.error('Network error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      candidates: [
        { id: '1', name: '', description: '' },
        { id: '2', name: '', description: '' }
      ]
    })
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Election
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Create New Election
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Create a simple election with candidates for people to vote on.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Election Details */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">Election Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200">
                  Election Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Student Council President Election"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="bg-slate-600/50 border-slate-500 text-white placeholder-slate-400 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this election is about..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-slate-600/50 border-slate-500 text-white placeholder-slate-400 focus:border-blue-500 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Candidates */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-lg">Candidates</CardTitle>
                  <CardDescription className="text-slate-300">
                    Add the candidates people can vote for (minimum 2 required)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addCandidate}
                  size="sm"
                  variant="outline"
                  className="border-slate-500 text-slate-300 hover:bg-slate-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.candidates.map((candidate, index) => (
                <div key={candidate.id} className="p-4 bg-slate-600/30 rounded-lg border border-slate-500">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white font-medium">Candidate {index + 1}</h4>
                    {formData.candidates.length > 2 && (
                      <Button
                        type="button"
                        onClick={() => removeCandidate(candidate.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-slate-200 text-sm">
                        Name *
                      </Label>
                      <Input
                        placeholder="Candidate name"
                        value={candidate.name}
                        onChange={(e) => handleCandidateChange(candidate.id, 'name', e.target.value)}
                        className="bg-slate-500/50 border-slate-400 text-white placeholder-slate-400 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-slate-200 text-sm">
                        Description
                      </Label>
                      <Textarea
                        placeholder="Brief description of the candidate (optional)"
                        value={candidate.description}
                        onChange={(e) => handleCandidateChange(candidate.id, 'description', e.target.value)}
                        className="bg-slate-500/50 border-slate-400 text-white placeholder-slate-400 focus:border-blue-500 min-h-[60px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>Default Settings:</strong> Elections will start immediately and run for 7 days. 
              Voters can select one candidate and no registration is required.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-600">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                Create Election
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 