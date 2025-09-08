import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConversationList from '../../components/messaging/ConversationList';
import MessageThread from '../../components/messaging/MessageThread';
import { MessageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Send } from 'lucide-react';

const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-create or find conversation for investor users
  useEffect(() => {
    if (user?.role === 'investor' && !selectedConversationId) {
      // For investors, automatically create/find conversation with admin
      handleNewConversation();
    }
  }, [user]);

  const handleNewConversation = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Creating conversation for user:', user.name, 'Role:', user.role);
      const conversationId = await MessageService.getOrCreateConversation(
        user.id,
        user.name,
        user.role === 'admin' ? 'admin' : 'affiliate'
      );
      console.log('✅ Conversation created/found:', conversationId);
      setSelectedConversationId(conversationId);
      setShowNewMessageForm(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessageContent.trim() || !user) return;

    setIsLoading(true);
    
    try {
      console.log('🔄 Sending new message from:', user.name, 'Role:', user.role);
      const conversationId = await MessageService.sendMessage(
        user.id,
        user.name,
        user.role === 'admin' ? 'admin' : 'affiliate',
        newMessageContent.trim()
      );
      
      console.log('✅ Message sent, conversation ID:', conversationId);
      setSelectedConversationId(conversationId);
      setNewMessageContent('');
      setShowNewMessageForm(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Messages">      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[calc(100vh-200px)] flex">
        {/* Conversation List */}
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onNewConversation={handleNewConversation}
        />
        
        {/* Message Thread */}
        {selectedConversationId ? (
          <MessageThread
            conversationId={selectedConversationId}
            recipientName={user?.role === 'admin' ? 'Affiliate' : 'Admin'}
          />
        ) : showNewMessageForm ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                New Message
              </h3>
            </div>
            
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    Message Content
                  </label>
                  <textarea
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    rows={8}
                    placeholder="Type your message here..."
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowNewMessageForm(false)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendNewMessage}
                    disabled={!newMessageContent.trim() || isLoading}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                  >
                    <Send size={16} className="mr-2 inline" />
                    {isLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                {user?.role === 'admin' ? 'Affiliate Communication Center' : 'Admin Communication'}
              </h3>
              <p className="text-gray-600 mb-6 uppercase tracking-wide text-sm">
                {user?.role === 'admin' 
                  ? 'Select a conversation or start a new one to communicate with affiliates'
                  : 'Start a conversation with the admin team'
                }
              </p>
              <button
                onClick={() => setShowNewMessageForm(true)}
                className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
              >
                <Send size={18} className="mr-2 inline" />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;