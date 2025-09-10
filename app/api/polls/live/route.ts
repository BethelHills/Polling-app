import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";

// Modern Next.js 15 API route with enhanced features
export async function GET(request: NextRequest) {
  try {
    // Get request headers for analytics
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const forwardedFor = headersList.get("x-forwarded-for");
    
    // Simulate real-time data with some randomness
    const polls = [
      {
        id: "1",
        title: "What's your favorite frontend framework?",
        description: "Help us understand the community's preferences",
        totalVotes: Math.floor(Math.random() * 500) + 1000,
        isActive: true,
        createdAt: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
        lastUpdated: new Date(),
        options: [
          { 
            id: "react", 
            text: "React", 
            votes: Math.floor(Math.random() * 200) + 400, 
            percentage: 0, 
            trend: 'up' as const 
          },
          { 
            id: "vue", 
            text: "Vue.js", 
            votes: Math.floor(Math.random() * 150) + 200, 
            percentage: 0, 
            trend: 'stable' as const 
          },
          { 
            id: "angular", 
            text: "Angular", 
            votes: Math.floor(Math.random() * 100) + 150, 
            percentage: 0, 
            trend: 'down' as const 
          },
          { 
            id: "svelte", 
            text: "Svelte", 
            votes: Math.floor(Math.random() * 180) + 300, 
            percentage: 0, 
            trend: 'up' as const 
          },
        ]
      },
      {
        id: "2",
        title: "Which Next.js 15 feature excites you most?",
        description: "Share your thoughts on the latest Next.js capabilities",
        totalVotes: Math.floor(Math.random() * 300) + 800,
        isActive: true,
        createdAt: new Date(Date.now() - Math.random() * 172800000), // Random time in last 48h
        lastUpdated: new Date(),
        options: [
          { 
            id: "server-actions", 
            text: "Server Actions", 
            votes: Math.floor(Math.random() * 100) + 200, 
            percentage: 0, 
            trend: 'up' as const 
          },
          { 
            id: "react-19", 
            text: "React 19 Integration", 
            votes: Math.floor(Math.random() * 80) + 180, 
            percentage: 0, 
            trend: 'up' as const 
          },
          { 
            id: "turbopack", 
            text: "Turbopack", 
            votes: Math.floor(Math.random() * 60) + 120, 
            percentage: 0, 
            trend: 'stable' as const 
          },
          { 
            id: "app-router", 
            text: "App Router", 
            votes: Math.floor(Math.random() * 120) + 250, 
            percentage: 0, 
            trend: 'up' as const 
          },
        ]
      }
    ];

    // Calculate percentages for each poll
    const pollsWithPercentages = polls.map(poll => ({
      ...poll,
      options: poll.options.map(option => ({
        ...option,
        percentage: poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0
      }))
    }));

    // Add analytics metadata
    const response = NextResponse.json({
      success: true,
      polls: pollsWithPercentages,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: userAgent.substring(0, 100), // Truncate for privacy
        ip: forwardedFor ? forwardedFor.split(',')[0] : 'unknown',
        version: "1.0.0",
        features: [
          "Next.js 15 Server Actions",
          "React 19 use() hook",
          "Optimistic Updates",
          "Real-time Data"
        ]
      }
    });

    // Set cache headers for real-time data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Add CORS headers for real-time updates
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Error fetching live polls:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch live polls",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
