"use client";

import type * as React from 'react';
import { useEffect, useRef } from 'react';
import type { Message, ChatSettings } from '@/types';
import { MessageItem } from './MessageItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image'; // For placeholder if no messages

interface ChatViewProps {
  messages: Message[];
  settings: ChatSettings;
}

export function ChatView({ messages, settings }: ChatViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Effect to scroll to bottom also when settings change that might affect layout, like bg image loading
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100); // Delay slightly for image loading
    return () => clearTimeout(timer);
  }, [settings.bgImage]);


  const backgroundStyle: React.CSSProperties = {
    backgroundColor: settings.bgColor || 'hsl(var(--background))', // Fallback to theme background
    backgroundImage: settings.bgImage ? `url(${settings.bgImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="flex-1 overflow-hidden relative" style={backgroundStyle}>
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-4 ">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-70">
              <Image 
                src="https://placehold.co/300x200.png" 
                alt="No messages yet" 
                width={300} 
                height={200} 
                className="rounded-lg mb-4"
                data-ai-hint="empty chat conversation"
              />
              <p className="text-lg font-medium">No messages yet.</p>
              <p className="text-sm">Start a conversation or load history from settings!</p>
            </div>
          ) : (
            messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
