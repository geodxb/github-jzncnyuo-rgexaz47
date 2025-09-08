import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../common/Card';
import { AlertTriangle, X, MessageSquare, Shield, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
  id: string;
  title: string;
  content: string;
  type: 'warning' | 'critical' | 'info';
  date: string;
  sender: string;
  read: boolean;
}

const AlertMessages = () => {
  // Sample messages with the specific Mexico policy violation message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-001',
      title: 'Account Restrictions - Policy Violations',
      content: 'You have one or more accounts under restriction. It seems that many of them are from Mexico. These violations come from withdrawal requests made to external sources, unregistered bank accounts, bank accounts outside the registered country, or using third party custody or banks that go against the rules of the broker and breach contract regulations. If this continues, your account might be restricted and potentially deactivated. Make sure to inform your investors about this issue and ensure the contract is followed.',
      type: 'critical',
      date: new Date().toISOString().split('T')[0],
      sender: 'Affiliate Manager',
      read: false
    },
    {
      id: 'msg-002',
      title: 'Withdrawal Processing Delays',
      content: 'Due to increased security measures, all withdrawals are currently taking 3-5 business days to process. We appreciate your patience during this time.',
      type: 'info',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sender: 'Operations Team',
      read: false
    },
    {
      id: 'msg-003',
      title: 'Commission Structure Update',
      content: 'Please be advised that the commission structure remains unchanged at 15% for all withdrawals. This rate ensures we can continue providing high-quality service and platform stability.',
      type: 'info',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sender: 'Finance Department',
      read: true
    },
    // Add more messages as needed
    // ...
  ]);

  const markAsRead = (id: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, read: true } : msg
      )
    );
  };

  const markAllAsRead = () => {
    setMessages(prev => 
      prev.map(msg => ({ ...msg, read: true }))
    );
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const unreadCount = messages.filter(m => !m.read).length;
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  return (
    <Card title="Messages" className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-3">
            <MessageSquare size={20} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Affiliate Manager Messages</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="flex space-x-2">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm ${
                  filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm ${
                  filter === 'unread' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            <button
            onClick={markAllAsRead}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            Mark all read
          </button>
          </div>
        )}
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {filter === 'unread' && messages.filter(m => !m.read).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No unread messages</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages
            .filter(message => filter === 'all' || !message.read)
            .map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className={`border rounded-lg overflow-hidden ${
                message.read 
                  ? 'border-gray-200 bg-white' 
                  : message.type === 'critical'
                    ? 'border-red-200 bg-red-50'
                    : message.type === 'warning'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className={`px-4 py-3 flex justify-between items-center ${
                message.type === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : message.type === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {message.type === 'critical' && <AlertTriangle size={16} />}
                  {message.type === 'warning' && <Clock size={16} />}
                  {message.type === 'info' && <Shield size={16} />}
                  <span className="font-medium truncate max-w-[200px] md:max-w-[300px]">{message.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}>
                    {expandedMessage === message.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className={`p-4 ${expandedMessage === message.id ? '' : 'max-h-24 overflow-hidden'}`}>
                <p className="text-gray-700 mb-3 whitespace-pre-line">
                  {expandedMessage === message.id 
                    ? message.content 
                    : message.content.length > 150 
                      ? message.content.substring(0, 150) + '...' 
                      : message.content}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>
                    <span className="font-medium">{message.sender}</span>
                    <span className="mx-2">•</span>
                    <span>{message.date}</span>
                  </div>
                  {!message.read && (
                    <button
                      onClick={() => markAsRead(message.id)}
                      className="text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No messages</h3>
              <p className="text-gray-500">You don't have any messages at this time.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

export default AlertMessages;