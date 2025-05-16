
"use client";

import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { User, Bot } from 'lucide-react';
import { useState, useEffect } from 'react'; // Import useState and useEffect

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.sender === 'user';
  const [formattedTimestamp, setFormattedTimestamp] = useState<string | null>(null);

  useEffect(() => {
    // This ensures timestamp formatting occurs only on the client, after hydration.
    try {
      const dateObject = new Date(message.timestamp);
      if (!isNaN(dateObject.getTime())) {
        setFormattedTimestamp(format(dateObject, 'p'));
      } else {
        // Fallback for invalid dates
        setFormattedTimestamp("Invalid time");
      }
    } catch (error) {
      console.error("Error formatting date for message:", message.id, error);
      setFormattedTimestamp("Time N/A"); // Fallback for formatting errors
    }
  }, [message.timestamp]); // Re-run if message.timestamp changes

  return (
    <div
      className={cn(
        "flex items-end gap-2 mb-4 max-w-[85%] sm:max-w-[75%]",
        isUser ? "self-end flex-row-reverse" : "self-start"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={isUser ? "https://placehold.co/40x40.png" : "https://placehold.co/40x40.png"} data-ai-hint={isUser ? "user profile" : "bot profile"} />
        <AvatarFallback>{isUser ? <User size={18}/> : <Bot size={18}/>}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "rounded-lg p-3 shadow-md",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground rounded-bl-none border"
        )}
      >
        <p className="text-sm break-words">{message.text}</p>
        <p
          className={cn(
            "text-xs mt-1",
            isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left",
            !formattedTimestamp && "h-4" // Placeholder height before client-side rendering
          )}
        >
          {formattedTimestamp || <>&nbsp;</>} {/* Show formatted time or a non-breaking space as placeholder */}
        </p>
      </div>
    </div>
  );
}
