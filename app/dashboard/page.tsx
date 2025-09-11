import { Suspense } from "react";
import { RealTimePollDashboardServer } from "@/components/RealTimePollDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Code, Rocket } from "lucide-react";

// Loading component with modern React 19 Suspense
function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 bg-muted animate-pulse rounded" />
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-2 w-full bg-muted rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Context7 Integration Demo Component
function Context7IntegrationDemo() {
  return (
    <Card className="mb-6 border-2 border-dashed border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Context7 Integration Demo
        </CardTitle>
        <CardDescription>
          This dashboard demonstrates context-aware AI with live documentation injection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Code className="h-4 w-4" />
              Modern Features Used
            </h4>
            <div className="space-y-1">
              <Badge variant="outline">Next.js 15 Server Actions</Badge>
              <Badge variant="outline">React 19 use() hook</Badge>
              <Badge variant="outline">Optimistic Updates</Badge>
              <Badge variant="outline">Real-time Data</Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Context7 Benefits
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Live documentation injection</li>
              <li>• Up-to-date API references</li>
              <li>• Context-aware code generation</li>
              <li>• Real-time best practices</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This component was built using Context7 to inject the latest 
            Next.js 15 and React 19 documentation, ensuring we use the most current features 
            and best practices available.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Context7 Integration Demo */}
      <Context7IntegrationDemo />
      
      {/* Real-time Poll Dashboard with Suspense */}
      <Suspense fallback={<DashboardLoading />}>
        <RealTimePollDashboardServer />
      </Suspense>
    </div>
  );
}

// Metadata for the page
export const metadata = {
  title: "Real-Time Poll Dashboard | Next.js 15 + React 19",
  description: "Modern polling dashboard built with Next.js 15, React 19, and Context7 integration for live documentation injection",
  keywords: ["Next.js 15", "React 19", "Context7", "Real-time", "Polling", "Dashboard"],
  authors: [{ name: "Context7 AI Assistant" }],
  openGraph: {
    title: "Real-Time Poll Dashboard",
    description: "Demonstrating context-aware AI with live documentation injection",
    type: "website",
  },
};
