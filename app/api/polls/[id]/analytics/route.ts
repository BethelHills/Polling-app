import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabaseServerClient'

/**
 * GET /api/polls/[id]/analytics
 * Get detailed analytics for a specific poll
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params

    // Authenticate user
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
        { status: 401 }
      )
    }

    const { data: userData, error: userErr } = await supabaseServerClient.auth.getUser(token)
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 }
      )
    }

    // Get poll details and verify ownership
    const { data: poll, error: pollError } = await supabaseServerClient
      .from('polls')
      .select('id, title, description, is_active, created_at, owner_id')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { success: false, message: "Poll not found" },
        { status: 404 }
      )
    }

    // Check if user owns the poll
    if (poll.owner_id !== userData.user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied - You can only view analytics for your own polls" },
        { status: 403 }
      )
    }

    // Get poll options with vote counts
    const { data: options, error: optionsError } = await supabaseServerClient
      .from('poll_options')
      .select('id, text, votes, order_index')
      .eq('poll_id', pollId)
      .order('votes', { ascending: false })

    if (optionsError) {
      console.error('Error fetching poll options:', optionsError)
      return NextResponse.json(
        { success: false, message: "Failed to fetch poll options" },
        { status: 500 }
      )
    }

    // Get vote details with timestamps
    const { data: votes, error: votesError } = await supabaseServerClient
      .from('votes')
      .select(`
        id,
        created_at,
        option_id,
        poll_options!inner(text)
      `)
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false })

    if (votesError) {
      console.error('Error fetching votes:', votesError)
      return NextResponse.json(
        { success: false, message: "Failed to fetch vote details" },
        { status: 500 }
      )
    }

    // Calculate analytics
    const totalVotes = options.reduce((sum, option) => sum + option.votes, 0)
    const pollDuration = Date.now() - new Date(poll.created_at).getTime()
    const pollDurationDays = Math.floor(pollDuration / (1000 * 60 * 60 * 24))
    const pollDurationHours = Math.floor(pollDuration / (1000 * 60 * 60))

    // Calculate vote distribution
    const voteDistribution = options.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
    }))

    // Calculate voting trends (votes per day)
    const votesByDay = votes.reduce((acc, vote) => {
      const day = new Date(vote.created_at).toISOString().split('T')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate voting trends (votes per hour for last 24 hours)
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000)
    const recentVotes = votes.filter(vote => 
      new Date(vote.created_at).getTime() > last24Hours
    )

    const votesByHour = recentVotes.reduce((acc, vote) => {
      const hour = new Date(vote.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // Get top performing options
    const topOptions = voteDistribution
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3)

    // Calculate engagement metrics
    const averageVotesPerDay = pollDurationDays > 0 ? totalVotes / pollDurationDays : totalVotes
    const peakVotingHour = Object.entries(votesByHour)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null

    // Get recent activity (last 10 votes)
    const recentActivity = votes.slice(0, 10).map(vote => ({
      id: vote.id,
      option_text: (vote.poll_options as { text?: string })?.text || 'Unknown',
      created_at: vote.created_at,
      time_ago: getTimeAgo(vote.created_at)
    }))

    return NextResponse.json(
      { 
        success: true, 
        analytics: {
          poll: {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            is_active: poll.is_active,
            created_at: poll.created_at,
            duration_days: pollDurationDays,
            duration_hours: pollDurationHours
          },
          summary: {
            total_votes: totalVotes,
            total_options: options.length,
            average_votes_per_day: Math.round(averageVotesPerDay * 100) / 100,
            peak_voting_hour: peakVotingHour,
            engagement_score: calculateEngagementScore(totalVotes, pollDurationDays)
          },
          distribution: voteDistribution,
          top_options: topOptions,
          trends: {
            votes_by_day: votesByDay,
            votes_by_hour: votesByHour
          },
          recent_activity: recentActivity
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in poll analytics API:', error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// Helper function to calculate time ago
function getTimeAgo(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diff = now - date

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

// Helper function to calculate engagement score
function calculateEngagementScore(totalVotes: number, daysActive: number): number {
  if (daysActive === 0) return totalVotes
  const dailyAverage = totalVotes / daysActive
  // Score based on daily average (higher is better)
  return Math.min(100, Math.round(dailyAverage * 10))
}
