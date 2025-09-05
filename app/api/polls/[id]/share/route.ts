import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import QRCode from 'qrcode'

/**
 * GET /api/polls/[id]/share
 * Generate sharing information including QR code for a poll
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json, qr, or both

    // Get poll details
    const { data: poll, error: pollError } = await supabaseServerClient
      .from('polls')
      .select('id, title, description, is_active, created_at')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { success: false, message: "Poll not found" },
        { status: 404 }
      )
    }

    if (!poll.is_active) {
      return NextResponse.json(
        { success: false, message: "Poll is no longer active" },
        { status: 400 }
      )
    }

    // Generate sharing URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const pollUrl = `${baseUrl}/polls/${pollId}`
    const voteUrl = `${baseUrl}/polls/${pollId}/vote`
    const shareUrl = `${baseUrl}/polls/${pollId}/share`

    // Generate QR code
    let qrCodeDataUrl = ''
    try {
      qrCodeDataUrl = await QRCode.toDataURL(pollUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (qrError) {
      console.error('Error generating QR code:', qrError)
    }

    // Generate social media sharing data
    const socialSharing = {
      twitter: {
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this poll: ${poll.title}`)}&url=${encodeURIComponent(pollUrl)}`,
        text: `Check out this poll: ${poll.title}`
      },
      facebook: {
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pollUrl)}`,
        text: `Share this poll: ${poll.title}`
      },
      linkedin: {
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pollUrl)}`,
        text: `Share this poll: ${poll.title}`
      },
      whatsapp: {
        url: `https://wa.me/?text=${encodeURIComponent(`Check out this poll: ${poll.title} ${pollUrl}`)}`,
        text: `Check out this poll: ${poll.title}`
      },
      telegram: {
        url: `https://t.me/share/url?url=${encodeURIComponent(pollUrl)}&text=${encodeURIComponent(`Check out this poll: ${poll.title}`)}`,
        text: `Check out this poll: ${poll.title}`
      }
    }

    // Generate embed code for websites
    const embedCode = `<iframe src="${pollUrl}" width="100%" height="400" frameborder="0" title="${poll.title}"></iframe>`

    // Generate sharing statistics (if user is authenticated)
    let canViewStats = false
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (token) {
      try {
        const { data: userData } = await supabaseServerClient.auth.getUser(token)
        if (userData?.user) {
          // Check if user owns the poll
          const { data: pollOwner } = await supabaseServerClient
            .from('polls')
            .select('owner_id')
            .eq('id', pollId)
            .single()
          
          canViewStats = pollOwner?.owner_id === userData.user.id
        }
      } catch {
        // Ignore auth errors for public sharing
      }
    }

    // Get basic poll statistics
    const { data: pollStats } = await supabaseServerClient
      .from('poll_options')
      .select('votes')
      .eq('poll_id', pollId)

    const totalVotes = pollStats?.reduce((sum, option) => sum + option.votes, 0) || 0

    const sharingData = {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        created_at: poll.created_at,
        total_votes: totalVotes
      },
      urls: {
        poll: pollUrl,
        vote: voteUrl,
        share: shareUrl
      },
      qr_code: qrCodeDataUrl,
      social_sharing: socialSharing,
      embed_code: embedCode,
      can_view_stats: canViewStats
    }

    // Return different formats based on request
    if (format === 'qr') {
      // Return QR code image directly
      if (!qrCodeDataUrl) {
        return NextResponse.json(
          { success: false, message: "Failed to generate QR code" },
          { status: 500 }
        )
      }
      
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
      return new NextResponse(qrBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="poll-${pollId}-qr.png"`
        }
      })
    }

    if (format === 'embed') {
      // Return embed code
      return new NextResponse(embedCode, {
        headers: {
          'Content-Type': 'text/html'
        }
      })
    }

    // Return JSON with all sharing data
    return NextResponse.json(
      { 
        success: true, 
        sharing: sharingData
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in poll sharing API:', error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/polls/[id]/share
 * Track sharing events and generate sharing analytics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params
    const body = await request.json()
    const { platform, method, user_agent } = body

    // Validate required fields
    if (!platform || !method) {
      return NextResponse.json(
        { success: false, message: "Platform and method are required" },
        { status: 400 }
      )
    }

    // Check if poll exists
    const { data: poll, error: pollError } = await supabaseServerClient
      .from('polls')
      .select('id, is_active')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { success: false, message: "Poll not found" },
        { status: 404 }
      )
    }

    if (!poll.is_active) {
      return NextResponse.json(
        { success: false, message: "Poll is no longer active" },
        { status: 400 }
      )
    }

    // Log sharing event (you might want to create a shares table for analytics)
    const shareData = {
      poll_id: pollId,
      platform,
      method,
      user_agent: user_agent || request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      created_at: new Date().toISOString()
    }

    // For now, we'll just log to console
    // In production, you'd want to store this in a database table
    console.log('Poll sharing event:', shareData)

    return NextResponse.json(
      { 
        success: true, 
        message: "Sharing event tracked",
        share_data: shareData
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in poll sharing tracking API:', error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
