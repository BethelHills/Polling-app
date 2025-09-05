'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PollWithResults } from '@/lib/types'
import { submitVote } from '@/lib/mock-actions'
import { CheckCircle, Users, Calendar } from 'lucide-react'
import { SafeRichText } from '@/components/SafeHtmlRenderer'

interface PollDetailViewProps {
  poll: PollWithResults
}

export function PollDetailView({ poll }: PollDetailViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasVoted, setHasVoted] = useState(poll.user_has_voted)
  const [showThankYou, setShowThankYou] = useState(false)
  const [votedOption, setVotedOption] = useState<string | null>(null)

  const handleVote = async () => {
    if (!selectedOption) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await submitVote(poll.id, selectedOption)
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setHasVoted(true)
        setVotedOption(selectedOption)
        setShowThankYou(true)
        // Don't refresh immediately, show thank you message first
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
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

  return (
    <div className="space-y-6">
      {/* Poll Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription className="text-base">
                  <SafeRichText 
                    content={poll.description}
                    fallback={poll.description}
                  />
                </CardDescription>
              )}
            </div>
            <Badge variant={poll.is_active ? 'default' : 'secondary'}>
              {poll.is_active ? 'Active' : 'Closed'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {poll.total_votes} votes
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {formatDate(poll.created_at)}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Thank You Message */}
      {showThankYou && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Thank You for Voting!
                </h3>
                <p className="text-green-700">
                  Your vote has been recorded. You selected: <strong>
                    {poll.options.find(opt => opt.id === votedOption)?.text}
                  </strong>
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Refreshing to show updated results...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Section */}
      {!hasVoted && !showThankYou && poll.is_active ? (
        <Card>
          <CardHeader>
            <CardTitle>Cast Your Vote</CardTitle>
            <CardDescription>
              Select one option below and click &quot;Submit Vote&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {poll.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOption === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedOption === option.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`} />
                    <span className="font-medium">{option.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <Button
              onClick={handleVote}
              disabled={!selectedOption || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
          </CardContent>
        </Card>
      ) : hasVoted ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">You have already voted!</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              This poll is no longer active.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Current voting results ({poll.total_votes} total votes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.options
            .sort((a, b) => b.votes - a.votes)
            .map((option, index) => (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {index === 0 && poll.total_votes > 0 && (
                      <Badge variant="default" className="text-xs">
                        Leading
                      </Badge>
                    )}
                    <span className="font-medium">{option.text}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {option.votes} votes ({option.percentage}%)
                  </div>
                </div>
                <Progress value={option.percentage} className="h-2" />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
