import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../hooks/useMessages';
import { AffiliateMessage } from '../../types/message';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Reply,
  Clock,
  CheckCircle,
  AlertTriangle,
  User
} from 'lucide-react';

interface MessageThreadProps {
  conversationId: string;
  recipientName?: string;
}

const MessageThread = ({ conversationId, recipientName }: MessageThreadProps) => {
  const { user } = useAuth();
  const { messages, loading } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<AffiliateMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isLoading) return;

    setIsLoading(true);
    
    try {
      await MessageService.sendMessage(
        user.id,
        user.name,
        user.role === 'admin' ? 'admin' : 'affiliate',
        newMessage.trim(),
        conversationId,
        replyingTo?.id
      );
      
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-amber-500';
      case 'low': return 'border-l-gray-400';
      default: return 'border-l-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium uppercase tracking-wide">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
              {user?.role === 'admin' ? 'AFFILIATE COMMUNICATION' : 'ADMIN COMMUNICATION'}
            </h3>
            <p className="text-sm text-gray-600 uppercase tracking-wide">
              {recipientName ? `Conversation with ${recipientName}` : 'Real-time messaging'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2 uppercase tracking-wide">
              Start the conversation
            </h3>
            <p className="text-gray-500 uppercase tracking-wide text-sm">
              Send your first message to begin communicating
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.senderId === user?.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  } rounded-lg p-4 shadow-sm border-l-4 ${getPriorityColor(message.priority)}`}
                >
                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className="mb-2 pb-2 border-b border-gray-300 opacity-75">
                      <div className="flex items-center space-x-1 text-xs">
                        <Reply size={12} />
                        <span>Replying to message</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Message header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium uppercase tracking-wide ${
                        message.senderId === user?.id ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {message.senderName}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide ${
                        message.senderRole === 'admin' 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {message.senderRole}
                      </span>
                    </div>
                    
                    {message.senderId !== user?.id && (
                      <button
                        onClick={() => setReplyingTo(message)}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          message.senderId === user?.id ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        <Reply size={14} />
                      </button>
                    )}
                  </div>
                  
                  {/* Message content */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
                    {message.content}
                  </div>
                  
                  {/* Message footer */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${
                      message.senderId === user?.id ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply size={16} className="text-gray-600" />
              <span className="text-sm text-gray-700 font-medium uppercase tracking-wide">
                Replying to {replyingTo.senderName}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1 truncate">
            {replyingTo.content.substring(0, 100)}...
          </p>
        </div>
      )}

      {/* Message Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 resize-none font-medium"
              rows={3}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span className="uppercase tracking-wide">Press Enter to send, Shift+Enter for new line</span>
          <span className="uppercase tracking-wide">{newMessage.length}/1000</span>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;