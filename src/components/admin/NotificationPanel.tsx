import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import { useWithdrawalRequests, useInvestors } from '../../hooks/useFirestore';
import { Bell, X, DollarSign, UserCheck, AlertTriangle, CheckCircle, Users, TrendingUp, MessageSquare } from 'lucide-react';

interface Notification {
  id: string;
  type: 'withdrawal' | 'account' | 'system' | 'investor' | 'message';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  investorName?: string;
  amount?: number;
}

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);
  const { withdrawalRequests } = useWithdrawalRequests();
  const { investors } = useInvestors();

  useEffect(() => {
    // Generate notifications based on real data
    const newNotifications: Notification[] = [];

    // Withdrawal request notifications
    const pendingWithdrawals = withdrawalRequests.filter(req => req.status === 'Pending');
    pendingWithdrawals.forEach(req => {
      newNotifications.push({
        id: `withdrawal-${req.id}`,
        type: 'withdrawal',
        title: 'Withdrawal Request',
        message: `${req.investorName} requested $${req.amount.toLocaleString()} withdrawal`,
        timestamp: req.createdAt,
        read: false,
        priority: req.amount > 50000 ? 'high' : 'medium',
        investorName: req.investorName,
        amount: req.amount
      });
    });

    // Add message notification for Mexico policy violation
    newNotifications.push({
      id: `message-policy-violation`,
      type: 'message' as 'message',
      title: 'Account Restrictions - Policy Violations',
      message: 'Multiple accounts from Mexico have policy violations. Urgent attention required.',
      timestamp: new Date(),
      read: false,
      priority: 'high'
    });

    // Account status notifications
    const restrictedInvestors = investors.filter(inv => 
      inv.accountStatus?.includes('Restricted') || inv.accountStatus?.includes('Closed')
    );
    restrictedInvestors.forEach(inv => {
      newNotifications.push({
        id: `account-${inv.id}`,
        type: 'account',
        title: 'Account Status Update Required',
        message: `${inv.name} - ${inv.accountStatus}`,
        timestamp: inv.updatedAt,
        read: false,
        priority: 'medium',
        investorName: inv.name
      });
    });

    // New investor notifications (joined in last 30 days)
    const recentInvestors = investors.filter(inv => {
      const joinDate = new Date(inv.joinDate);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return joinDate > monthAgo;
    });
    recentInvestors.forEach(inv => {
      newNotifications.push({
        id: `investor-${inv.id}`,
        type: 'investor',
        title: 'New Investor Joined',
        message: `${inv.name} from ${inv.country} deposited $${inv.initialDeposit.toLocaleString()}`,
        timestamp: new Date(inv.joinDate),
        read: false,
        priority: 'low',
        investorName: inv.name,
        amount: inv.initialDeposit
      });
    });

    // Sort by priority and timestamp (newest first)
    newNotifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    setNotifications(newNotifications);
  }, [withdrawalRequests, investors]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'withdrawal': return <DollarSign size={18} className="text-red-600" />;
      case 'account': return <UserCheck size={18} className="text-amber-600" />;
      case 'system': return <AlertTriangle size={18} className="text-blue-600" />;
      case 'message': return <MessageSquare size={18} className="text-red-600" />;
      case 'investor': return <Users size={18} className="text-green-600" />;
      default: return <Bell size={18} className="text-gray-600" />;
    }
  };

  const getPriorityStyles = (priority: string, read: boolean) => {
    const baseStyles = "p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md";
    
    if (read) {
      return `${baseStyles} bg-gray-50 border-gray-200 opacity-70`;
    }
    
    switch (priority) {
      case 'high': 
        return `${baseStyles} bg-red-50 border-red-200 hover:bg-red-100`;
      case 'medium': 
        return `${baseStyles} bg-amber-50 border-amber-200 hover:bg-amber-100`;
      case 'low': 
        return `${baseStyles} bg-blue-50 border-blue-200 hover:bg-blue-100`;
      default: 
        return `${baseStyles} bg-gray-50 border-gray-200 hover:bg-gray-100`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 6);

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
            <Bell size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={getPriorityStyles(notification.priority, notification.read)}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-semibold ${
                          notification.read ? 'text-gray-600' : 'text-gray-800'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {/* Action indicators */}
                      {notification.type === 'withdrawal' && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            Requires Action
                          </span>
                          {notification.amount && notification.amount > 50000 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              High Amount
                            </span>
                          )}
                        </div>
                      )}
                      
                      {notification.type === 'account' && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                            Review Required
                          </span>
                        </div>
                      )}
                      
                      {notification.type === 'message' && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            Affiliate Manager Message
                          </span>
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            View in Messages Tab
                          </span>
                        </div>
                      )}
                      
                      {notification.type === 'investor' && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            Welcome New Client
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">All caught up!</h3>
              <p className="text-gray-500">No new notifications at this time.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {notifications.length > 6 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            fullWidth
          >
            {showAll ? 'Show Less' : `Show All Notifications (${notifications.length})`}
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      {notifications.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs text-red-600 font-medium mb-1">Withdrawals</p>
              <p className="text-lg font-bold text-red-700 flex items-center justify-center">
                {notifications.filter(n => n.type === 'withdrawal' || n.type === 'message').length}
                {notifications.filter(n => n.type === 'message' && !n.read).length > 0 && (
                  <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-600 font-medium mb-1">Accounts</p>
              <p className="text-lg font-bold text-amber-700">
                {notifications.filter(n => n.type === 'account').length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-1">New Clients</p>
              <p className="text-lg font-bold text-green-700">
                {notifications.filter(n => n.type === 'investor').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default NotificationPanel;