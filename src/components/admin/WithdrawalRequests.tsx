import { useState } from 'react';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useWithdrawalRequests } from '../../hooks/useFirestore';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const WithdrawalRequests = () => {
  const { user } = useAuth();
  const { withdrawalRequests, loading, error, refetch } = useWithdrawalRequests();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('');
  
  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    if (!user) return;
    
    setIsLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const status = action === 'approve' ? 'Approved' : 'Rejected';
      await FirestoreService.updateWithdrawalRequest(id, status, user.id, reason);
      await refetch();
      
      // Close modal if open
      setShowReasonModal(false);
      setSelectedRequest(null);
      setReason('');
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const openReasonModal = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowReasonModal(true);
  };

  const handleModalSubmit = () => {
    if (selectedRequest) {
      handleAction(selectedRequest.id, actionType, reason);
    }
  };
  
  const columns = [
    {
      key: 'investorName',
      header: 'Investor',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">ID: {row.investorId.slice(-8)}</p>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right' as 'right',
      render: (value: number) => (
        <span className="font-semibold">${value?.toLocaleString() || '0'}</span>
      ),
    },
    {
      key: 'date',
      header: 'Request Date',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div>
            <p>{date.toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">{date.toLocaleTimeString()}</p>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => {
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        let icon = null;
        
        if (value === 'Approved') {
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          icon = <CheckCircle size={12} className="mr-1" />;
        } else if (value === 'Rejected') {
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          icon = <XCircle size={12} className="mr-1" />;
        } else if (value === 'Pending') {
          bgColor = 'bg-amber-100';
          textColor = 'text-amber-800';
        }
        
        return (
          <span className={`px-2 py-1 text-xs rounded-full flex items-center ${bgColor} ${textColor}`}>
            {icon}
            {value}
          </span>
        );
      },
    },
    {
      key: 'reason',
      header: 'Notes',
      render: (value: string) => (
        value ? (
          <div className="flex items-center text-xs text-gray-600">
            <MessageSquare size={12} className="mr-1" />
            {value.length > 30 ? `${value.substring(0, 30)}...` : value}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => {
        if (row.status !== 'Pending') {
          return (
            <div className="text-center">
              <span className="text-gray-500 text-xs">
                {row.status === 'Pending' ? 'Awaiting Review' : 'Processed'}
              </span>
              {row.reason && (
                <p className="text-xs text-gray-400 max-w-32 truncate mt-1">
                  {row.reason}
                </p>
              )}
            </div>
          );
        }
        
        return (
          <div className="flex space-x-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => openReasonModal(row, 'approve')}
              isLoading={isLoading[row.id]}
              disabled={isLoading[row.id]}
            >
              <CheckCircle size={14} className="mr-1" />
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => openReasonModal(row, 'reject')}
              isLoading={isLoading[row.id]}
              disabled={isLoading[row.id]}
            >
              <XCircle size={14} className="mr-1" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={refetch}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <Table 
          columns={columns} 
          data={withdrawalRequests}
          isLoading={loading}
          emptyMessage="No withdrawal requests found"
        />
        {!loading && withdrawalRequests.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Total: {withdrawalRequests.length} request{withdrawalRequests.length !== 1 ? 's' : ''}
            {' • '}
            Pending: {withdrawalRequests.filter(req => req.status === 'Pending').length}
          </div>
        )}
      </Card>

      {/* Reason Modal */}
      <Modal
        isOpen={showReasonModal}
        onClose={() => {
          setShowReasonModal(false);
          setSelectedRequest(null);
          setReason('');
        }}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal Request`}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Request Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Investor</p>
                  <p className="font-medium">{selectedRequest.investorName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-medium">${selectedRequest.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Request Date</p>
                  <p className="font-medium">{new Date(selectedRequest.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium">{selectedRequest.status}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'approve' ? 'Approval Notes' : 'Rejection Reason'} (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={
                  actionType === 'approve' 
                    ? 'Add any notes about this approval...'
                    : 'Explain why this request is being rejected...'
                }
              />
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedRequest(null);
                  setReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'approve' ? 'success' : 'danger'}
                onClick={handleModalSubmit}
                isLoading={isLoading[selectedRequest.id]}
              >
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default WithdrawalRequests;