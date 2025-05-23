
"use client";

import type { NextPage } from 'next';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatView } from '@/components/chat/ChatView';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { MindmateLogo } from '@/components/icons/ChameleonLogo';
import type { Message, ChatSettings } from '@/types';
import { Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mindmateApiChat } from '@/ai/flows/mindmateApiChatFlow';

const initialMessages: Message[] = [
  { id: '1', text: 'Welcome to Mindmate!', sender: 'api', timestamp: new Date() },
  { id: '2', text: 'Customize your background and load chat history using the settings panel.', sender: 'api', timestamp: new Date(Date.now() + 1000) },
  { id: '3', text: 'To load sample history from a mock Python API, set the history URL in settings to: /api/python-chat-history', sender: 'api', timestamp: new Date(Date.now() + 2000) },
  { id: '4', text: 'You can also configure a custom API endpoint in settings for the AI to potentially use.', sender: 'api', timestamp: new Date(Date.now() + 3000) },
];

const Page: NextPage = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [settings, setSettings] = useState<ChatSettings>({
    bgColor: '#F0E6FF', 
    bgImage: '',
    chatHistoryApiUrl: '',
    chatMessageApiUrl: '',
    chatMessageApiPassword: '',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettingsJson = localStorage.getItem('mindmateChatSettings');
      if (savedSettingsJson) {
        try {
          const parsedSavedSettings = JSON.parse(savedSettingsJson) as Partial<ChatSettings>;
          setSettings(currentSettings => ({
            ...currentSettings,
            ...parsedSavedSettings,
            chatMessageApiUrl: parsedSavedSettings.chatMessageApiUrl || '',
            chatMessageApiPassword: parsedSavedSettings.chatMessageApiPassword || '',
          }));
        } catch (error) {
          console.error("Failed to parse settings from localStorage", error);
           setSettings({
            bgColor: '#F0E6FF',
            bgImage: '',
            chatHistoryApiUrl: '',
            chatMessageApiUrl: '',
            chatMessageApiPassword: '',
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mindmateChatSettings', JSON.stringify(settings));
    }
  }, [settings]);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsAiResponding(true);

    try {
      // Pass custom API settings to the Genkit flow
      const aiResponse = await mindmateApiChat({ 
        userInput: text,
        customApiUrl: settings.chatMessageApiUrl,
        customApiPassword: settings.chatMessageApiPassword
      });

      const apiMessage: Message = {
        id: crypto.randomUUID(),
        text: aiResponse.response,
        sender: 'api',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, apiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: 'Sorry, I encountered an error trying to respond.',
        sender: 'api',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      toast({
        title: 'AI Error',
        description: (error as Error).message || 'Could not get a response from the AI.',
        variant: 'destructive',
      });
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleSettingsChange = (newSettings: Partial<ChatSettings>) => {
    setSettings((prevSettings) => ({ ...prevSettings, ...newSettings }));
  };

  const handleLoadHistory = useCallback(async () => {
    if (!settings.chatHistoryApiUrl) {
      toast({
        title: 'API URL Missing',
        description: 'Please provide an API URL in settings to load history. For the demo, try: /api/python-chat-history',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingHistory(true);
    try {
      const response = await fetch(settings.chatHistoryApiUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText || response.statusText}`);
      }
      const historyMessages: Message[] = await response.json();
      
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
      setIsSettingsOpen(false); 
    }
  }, [settings.chatHistoryApiUrl, toast]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MindmateLogo className="h-8 w-8" />
          <h1 className="text-xl sm:text-2xl font-semibold text-primary">Mindmate</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} aria-label="Open settings">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <ChatView messages={messages} settings={settings} />
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoadingHistory || isAiResponding} />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onLoadHistory={handleLoadHistory}
      />
      
      {(isLoadingHistory || isAiResponding) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default Page;
