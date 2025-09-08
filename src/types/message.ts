export interface AffiliateMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'affiliate';
  content: string;
  timestamp: Date;
  conversationId: string;
  replyTo?: string;
  attachments?: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: Date;
  createdAt: Date;
  updatedAt: Date;
}