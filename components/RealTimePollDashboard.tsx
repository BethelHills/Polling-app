"use client";

import { useState, useTransition, useOptimistic, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Users, TrendingUp, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the modern polling system
interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface Poll {
  id: string;
  title: string;
  description: string;
  totalVotes: number;
  options: PollOption[];
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

interface RealTimePollDashboardProps {
  initialPolls: Poll[];
}

// Modern React 19 use() hook for async data
async function fetchPollData(pollId: string): Promise<Poll> {
  const response = await fetch(`/api/polls/${pollId}/live`);
  if (!response.ok) throw new Error('Failed to fetch poll data');
  return response.json();
}

// Server Action for optimistic updates
async function voteOnPoll(pollId: string, optionId: string): Promise<{ success: boolean; message: string }> {
  "use server";
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    });
    
    if (!response.ok) throw new Error('Vote failed');
    
    return { success: true, message: 'Vote recorded successfully!' };
  } catch (error) {
    return { success: false, message: 'Failed to record vote' };
  }
}

export function RealTimePollDashboard({ initialPolls }: RealTimePollDashboardProps) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [isPending, startTransition] = useTransition();
  const [optimisticPolls, addOptimisticPoll] = useOptimistic(
    polls,
    (state, newPoll: Poll) => [...state, newPoll]
  );

  // Modern React 19 use() hook for async operations
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [pollData, setPollData] = useState<Poll | null>(null);

  // Use the new use() hook for async data fetching
  if (selectedPoll && !pollData) {
    try {
      const data = use(fetchPollData(selectedPoll.id));
      setPollData(data);
    } catch (error) {
      console.error('Failed to fetch poll data:', error);
    }
  }

  // Optimistic voting with React 19 features
  const handleVote = (pollId: string, optionId: string) => {
    startTransition(async () => {
      // Optimistic update
      const updatedPolls = polls.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map(option => {
            if (option.id === optionId) {
              return {
                ...option,
                votes: option.votes + 1,
                percentage: ((option.votes + 1) / (poll.totalVotes + 1)) * 100,
                trend: 'up' as const
              };
            }
            return option;
          });
          
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1,
            lastUpdated: new Date()
          };
        }
        return poll;
      });

      setPolls(updatedPolls);

      // Server action
      const result = await voteOnPoll(pollId, optionId);
      
      if (!result.success) {
        // Revert optimistic update on failure
        setPolls(polls);
      }
    });
  };

  // Real-time refresh functionality
  const refreshPolls = () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/polls/live');
        const updatedPolls = await response.json();
        setPolls(updatedPolls);
      } catch (error) {
        console.error('Failed to refresh polls:', error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with real-time indicators */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Poll Dashboard</h1>
          <p className="text-muted-foreground">
            Live polling with Next.js 15 & React 19 features
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Live
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPolls}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Polls Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {optimisticPolls.map((poll) => (
          <Card key={poll.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{poll.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {poll.description}
                  </CardDescription>
                </div>
                <Badge variant={poll.isActive ? "default" : "secondary"}>
                  {poll.isActive ? "Active" : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Poll Options */}
              <div className="space-y-3">
                {poll.options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{option.text}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {option.votes} votes
                        </span>
                        <span className="text-sm font-semibold">
                          {option.percentage.toFixed(1)}%
                        </span>
                        {option.trend === 'up' && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                    <Progress value={option.percentage} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Poll Stats */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {poll.totalVotes}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(poll.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
                
                {poll.isActive && (
                  <Button
                    size="sm"
                    onClick={() => setSelectedPoll(poll)}
                    className="text-xs"
                  >
                    Vote
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {optimisticPolls.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No polls available</h3>
                <p className="text-muted-foreground">
                  Create your first poll to get started with real-time voting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Server Component for initial data fetching
export async function RealTimePollDashboardServer() {
  // This would be a server component that fetches initial data
  const initialPolls: Poll[] = [
    {
      id: "1",
      title: "What's your favorite frontend framework?",
      description: "Help us understand the community's preferences",
      totalVotes: 1247,
      isActive: true,
      createdAt: new Date(),
      lastUpdated: new Date(),
      options: [
        { id: "react", text: "React", votes: 456, percentage: 36.6, trend: 'up' },
        { id: "vue", text: "Vue.js", votes: 234, percentage: 18.8, trend: 'stable' },
        { id: "angular", text: "Angular", votes: 189, percentage: 15.2, trend: 'down' },
        { id: "svelte", text: "Svelte", votes: 368, percentage: 29.5, trend: 'up' },
      ]
    },
    {
      id: "2", 
      title: "Which Next.js 15 feature excites you most?",
      description: "Share your thoughts on the latest Next.js capabilities",
      totalVotes: 892,
      isActive: true,
      createdAt: new Date(),
      lastUpdated: new Date(),
      options: [
        { id: "server-actions", text: "Server Actions", votes: 234, percentage: 26.2, trend: 'up' },
        { id: "react-19", text: "React 19 Integration", votes: 198, percentage: 22.2, trend: 'up' },
        { id: "turbopack", text: "Turbopack", votes: 156, percentage: 17.5, trend: 'stable' },
        { id: "app-router", text: "App Router", votes: 304, percentage: 34.1, trend: 'up' },
      ]
    }
  ];

  return <RealTimePollDashboard initialPolls={initialPolls} />;
}
