export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'api';
  timestamp: Date;
}

export interface ChatSettings {
  bgColor: string;
  bgImage: string;
  chatHistoryApiUrl: string;
  chatMessageApiUrl?: string; // New: URL for sending messages
  chatMessageApiPassword?: string; // New: Password for the message API
}
