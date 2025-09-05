import { getAllPolls } from "@/lib/mock-actions";
import { PollCard } from "@/components/PollCard";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const polls = await getAllPolls();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Polling App</h1>
            </div>
            <Link href="/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Active Polls</h2>
          <p className="text-muted-foreground">
            Participate in polls or create your own to gather opinions
          </p>
        </div>

        {polls.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No polls yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to create a poll and start gathering opinions!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/create">
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Poll
                </Button>
              </Link>
              <Link href="/polls/1">
                <Button size="lg" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Demo Poll
                </Button>
              </Link>
              <Link href="/enhanced-demo">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Enhanced Demo
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
