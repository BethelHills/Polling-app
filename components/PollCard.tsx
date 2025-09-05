import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Poll } from "@/lib/types";
import { Users, Calendar, ArrowRight } from "lucide-react";
import { SafePollDescription } from "@/components/SafeHtmlRenderer";

interface PollCardProps {
  poll: Poll;
}

export function PollCard({ poll }: PollCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Link href={`/polls/${poll.id}`} className="block">
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="line-clamp-2">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription className="line-clamp-2">
                  <SafePollDescription
                    description={poll.description}
                    fallback={poll.description}
                  />
                </CardDescription>
              )}
            </div>
            <Badge variant={poll.is_active ? "default" : "secondary"}>
              {poll.is_active ? "Active" : "Closed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {poll.total_votes} votes
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(poll.created_at)}
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
