"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Copy, Share2, Check } from "lucide-react";

interface QRCodeShareProps {
  pollId: string;
  pollTitle: string;
}

export function QRCodeShare({ pollId, pollTitle }: QRCodeShareProps) {
  const [copied, setCopied] = useState(false);

  const pollUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/polls/${pollId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const sharePoll = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pollTitle,
          text: `Vote on this poll: ${pollTitle}`,
          url: pollUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Share Poll
        </CardTitle>
        <CardDescription>
          Share this poll with others using the QR code or link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center p-4 bg-white rounded-lg border">
          <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded">
            <QrCode className="h-32 w-32 text-gray-400" />
            {/* In a real implementation, you'd use qrcode.react here:
            <QRCodeSVG value={pollUrl} size={192} /> */}
          </div>
        </div>

        {/* Poll URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Poll URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pollUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button onClick={sharePoll} className="w-full">
          <Share2 className="h-4 w-4 mr-2" />
          Share Poll
        </Button>

        {/* Quick Stats */}
        <div className="pt-4 border-t space-y-2">
          <div className="text-sm text-muted-foreground">
            <Badge variant="outline" className="mr-2">
              Public Poll
            </Badge>
            Anyone with the link can vote
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
