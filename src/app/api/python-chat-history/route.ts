// src/app/api/python-chat-history/route.ts
import { NextResponse } from 'next/server';
import type { Message } from '@/types';

// This route simulates a Python API endpoint for fetching chat history.
export async function GET() {
  const mockHistory: Message[] = [
    {
      id: 'hist-1',
      text: 'Hello from the (simulated) Python API! This is a past message.',
      sender: 'api',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: 'hist-2',
      text: 'User asked something interesting here.',
      sender: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 55 * 1), // 55 minutes ago
    },
    {
      id: 'hist-3',
      text: 'And this was the Python API\'s wise reply.',
      sender: 'api',
      timestamp: new Date(Date.now() - 1000 * 60 * 50 * 1), // 50 minutes ago
    },
     {
      id: 'hist-4',
      text: 'Remember to set the API URL in settings to /api/python-chat-history to see this.',
      sender: 'api',
      timestamp: new Date(Date.now() - 1000 * 60 * 45 * 1), // 45 minutes ago
    }
  ];

  // Simulate some network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json(mockHistory);
}
