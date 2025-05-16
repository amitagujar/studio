"use client";

import type { NextPage } from 'next';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatView } from '@/components/chat/ChatView';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ChameleonLogo } from '@/components/icons/ChameleonLogo';
import type { Message, ChatSettings } from '@/types';
import { Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialMessages: Message[] = [
  { id: '1', text: 'Welcome to Chameleon Chat!', sender: 'api', timestamp: new Date() },
  { id: '2', text: 'Customize your background and load chat history using the settings panel.', sender: 'api', timestamp: new Date(Date.now() + 1000) },
];

const Page: NextPage = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [settings, setSettings] = useState<ChatSettings>({
    bgColor: '#F0E6FF', // Default to Light Violet
    bgImage: '',
    chatHistoryApiUrl: '',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('chameleonChatSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        // Set default background color if parsing fails or if bgColor is not set
        if (!settings.bgColor) {
           setSettings(prev => ({ ...prev, bgColor: '#F0E6FF'}));
        }
      }
    } else {
       // Ensure default bgColor is set if nothing in localStorage
       setSettings(prev => ({ ...prev, bgColor: '#F0E6FF'}));
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('chameleonChatSettings', JSON.stringify(settings));
  }, [settings]);


  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const handleSettingsChange = (newSettings: Partial<ChatSettings>) => {
    setSettings((prevSettings) => ({ ...prevSettings, ...newSettings }));
  };

  const handleLoadHistory = useCallback(async () => {
    if (!settings.chatHistoryApiUrl) {
      toast({
        title: 'API URL Missing',
        description: 'Please provide an API URL in settings to load history.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingHistory(true);
    try {
      const response = await fetch(settings.chatHistoryApiUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const historyMessages: Message[] = await response.json();
      
      // Ensure timestamps are Date objects
      const formattedMessages = historyMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp) 
      })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setMessages(formattedMessages);
      toast({
        title: 'Chat History Loaded',
        description: 'Previous conversation has been loaded.',
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast({
        title: 'Error Loading History',
        description: (error as Error).message || 'Could not fetch chat history from the provided URL.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingHistory(false);
      setIsSettingsOpen(false); // Close panel after attempting to load
    }
  }, [settings.chatHistoryApiUrl, toast]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ChameleonLogo className="h-8 w-8" />
          <h1 className="text-xl sm:text-2xl font-semibold text-primary">Chameleon Chat</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} aria-label="Open settings">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <ChatView messages={messages} settings={settings} />
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoadingHistory} />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onLoadHistory={handleLoadHistory}
      />
      
      {isLoadingHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
        </div>
      )}
    </div>
  );
};

export default Page;
