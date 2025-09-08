import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

/**
 * Represents a single option in a poll.
 */
interface PollOptionAnalytics {
  id: string | number;
  text: string;
  votes: number;
}

/**
 * Props for the PollAnalytics component.
 */
interface PollAnalyticsProps {
  options: PollOptionAnalytics[];
  totalVotes: number;
  title?: string;
}

/**
 * A component to display the analytics of a poll, including vote counts,
 * percentages, and progress bars for each option.
 */
const PollAnalytics: React.FC<PollAnalyticsProps> = ({ options, totalVotes, title = "Poll Results" }) => {
  // Sort options by votes in descending order
  const sortedOptions = [...options].sort((a, b) => b.votes - a.votes);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          A total of <span className="font-bold">{totalVotes}</span> votes have been cast.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedOptions.map((option) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{option.text}</p>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-sm">
                      {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                    </Badge>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white w-16 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress value={percentage} aria-label={`${percentage.toFixed(1)}%`} />
              </div>
            );
          })}
          {totalVotes === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No votes have been cast yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PollAnalytics;
