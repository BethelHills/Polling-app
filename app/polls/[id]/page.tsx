import { notFound } from "next/navigation";
import { getPoll } from "@/lib/mock-actions";
import { PollDetailView } from "@/components/PollDetailView";
import { QRCodeShare } from "@/components/QRCodeShare";

interface PollPageProps {
  params: {
    id: string;
  };
}

export default async function PollPage({ params }: PollPageProps) {
  const { id } = await params;
  const poll = await getPoll(id);

  if (!poll) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main poll content */}
        <div className="lg:col-span-2">
          <PollDetailView poll={poll} />
        </div>

        {/* Sidebar with QR code */}
        <div className="lg:col-span-1">
          <QRCodeShare pollId={poll.id} pollTitle={poll.title} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PollPageProps) {
  const { id } = await params;
  const poll = await getPoll(id);

  if (!poll) {
    return {
      title: "Poll Not Found",
    };
  }

  return {
    title: `${poll.title} - Polling App`,
    description: poll.description || `Vote on ${poll.title}`,
  };
}
