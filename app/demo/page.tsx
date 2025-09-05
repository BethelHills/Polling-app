import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, BarChart3, Vote, CheckCircle, Share2 } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Polling App Demo</h1>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Poll Detail Page Demo</h2>
          <p className="text-muted-foreground">
            Test the complete voting flow with mock data
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Demo Poll 1 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-blue-600" />
                Programming Languages
              </CardTitle>
              <CardDescription>
                What is your favorite programming language?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">
                  • JavaScript (45 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • Python (38 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • TypeScript (32 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • And 3 more options...
                </div>
              </div>
              <Link href="/polls/1">
                <Button className="w-full">
                  <Vote className="h-4 w-4 mr-2" />
                  Vote on This Poll
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Demo Poll 2 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Web Frameworks
              </CardTitle>
              <CardDescription>
                Which framework do you prefer for web development?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">
                  • React (67 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • Next.js (45 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • Vue.js (34 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • And 2 more options...
                </div>
              </div>
              <Link href="/polls/2">
                <Button className="w-full">
                  <Vote className="h-4 w-4 mr-2" />
                  Vote on This Poll
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Demo Poll 3 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                Learning Methods
              </CardTitle>
              <CardDescription>
                How do you prefer to learn new technologies?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">
                  • Hands-on projects (48 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • Online courses (42 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • Documentation (38 votes)
                </div>
                <div className="text-sm text-muted-foreground">
                  • And 3 more options...
                </div>
              </div>
              <Link href="/polls/3">
                <Button className="w-full">
                  <Vote className="h-4 w-4 mr-2" />
                  Vote on This Poll
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Demo */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6">Demo Features</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5 text-blue-600" />
                  Voting Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  Select an option from the poll
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  Click &quot;Submit Vote&quot; button
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  See &quot;Thank You&quot; confirmation
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  View updated results
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-green-600" />
                  Sharing Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  QR code generation (placeholder)
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  Copy poll URL to clipboard
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  Native device sharing
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  Direct link access
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
