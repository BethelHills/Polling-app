import { CreatePollForm } from "@/components/CreatePollForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function CreatePollPage() {
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
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Polls
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Create a New Poll</h2>
          <p className="text-muted-foreground">
            Create a poll to gather opinions and share it with others
          </p>
        </div>

        <CreatePollForm />
      </main>
    </div>
  );
}
