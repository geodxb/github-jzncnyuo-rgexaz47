import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import { useInvestors } from '../../hooks/useFirestore';
import { Eye, ChevronUp, ChevronDown, TrendingUp, TrendingDown, Edit, CheckCircle, XCircle } from 'lucide-react';

const InvestorsList = () => {
  const navigate = useNavigate();
  const { investors, loading, error } = useInvestors();
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const sortedInvestors = [...investors].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });
  
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' ? (
      <ChevronUp size={16} className="ml-1" />
    ) : (
      <ChevronDown size={16} className="ml-1" />
    );
  };
  
  const columns = [
    {
      key: 'name',
      header: (
        <button 
          onClick={() => handleSort('name')}
          className="flex items-center hover:text-purple-600 font-medium"
        >
          Name <SortIcon field="name" />
        </button>
      ),
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-medium text-sm">
              {value.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900">{row.name}</p>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                row.accountType === 'Pro' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-600 text-white'
              }`}>
                {row.accountType || 'Standard'}
              </span>
            </div>
            <p className="text-xs text-gray-500">ID: {row.id.slice(-8)}</p>
          </div>
        </div>
      )
    },
    {
      key: 'country',
      header: 'Country',
      render: (value: string, row: any) => (
        <div>
          <p className="text-sm text-gray-800">{row.country}</p>
        </div>
      )
    },
    {
      key: 'currentBalance',
      header: (
        <button 
          onClick={() => handleSort('currentBalance')}
          className="flex items-center hover:text-purple-600 font-medium"
        >
          Current Balance <SortIcon field="currentBalance" />
        </button>
      ),
      align: 'right' as 'right',
      render: (value: number) => (
        <div className="text-right">
          <p className="font-bold text-lg text-gray-800">${value?.toLocaleString() || '0'}</p>
          <p className="text-xs text-gray-500">USD</p>
        </div>
      )
    },
    {
      key: 'earnings',
      header: (
        <button 
          onClick={() => handleSort('earnings')}
          className="flex items-center hover:text-purple-600 font-medium"
        >
          Performance <SortIcon field="earnings" />
        </button>
      ),
      align: 'right' as 'right',
      render: (_: any, row: any) => {
        const earnings = row.currentBalance - row.initialDeposit;
        const isPositive = earnings >= 0;
        const percentage = row.initialDeposit > 0 ? (earnings / row.initialDeposit) * 100 : 0;
        
        return (
          <div className="text-right">
            <div className="flex items-center justify-end mb-1">
              {isPositive ? (
                <TrendingUp size={14} className="mr-1 text-green-500" />
              ) : (
                <TrendingDown size={14} className="mr-1 text-red-500" />
              )}
              <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}${earnings.toLocaleString()}
              </span>
            </div>
            <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{percentage.toFixed(1)}%
            </p>
          </div>
        );
      }
    },
    {
      key: 'accountStatus',
      header: 'Status',
      render: (value: string) => {
        const status = value || 'Active';
        let bgColor = 'bg-green-100';
        let textColor = 'text-green-800';
        let icon = <CheckCircle size={12} />;
        
        if (status.includes('Restricted')) {
          bgColor = 'bg-amber-100';
          textColor = 'text-amber-800';
          icon = <XCircle size={12} />;
        } else if (status.includes('Closed')) {
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          icon = <XCircle size={12} />;
        }
        
        return (
          <div className="space-y-1">
            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
              {icon}
              <span className="ml-1">{status.length > 15 ? status.substring(0, 15) + '...' : status}</span>
            </span>
          </div>
        );
      }
    },
    {
      key: 'joinDate',
      header: (
        <button 
          onClick={() => handleSort('joinDate')}
          className="flex items-center hover:text-purple-600 font-medium"
        >
          Join Date <SortIcon field="joinDate" />
        </button>
      ),
      render: (value: string) => (
        <div>
          <p className="text-sm text-gray-800">{new Date(value).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">
            {Math.floor((new Date().getTime() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as 'center',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
          >
            <Eye size={14} className="mr-1" /> View
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
          >
            <Edit size={14} className="mr-1" /> Edit
          </Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <Card title="Investors Management" className="overflow-hidden">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title="Investors Management" className="overflow-hidden">
      <Table 
        columns={columns} 
        data={sortedInvestors} 
        isLoading={loading}
        emptyMessage="No investors found"
      />
      
      {!loading && investors.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Active Investors</p>
              <p className="font-bold text-green-600 text-lg">
                {investors.filter(inv => !inv.accountStatus?.includes('Closed')).length}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Restricted Accounts</p>
              <p className="font-bold text-amber-600 text-lg">
                {investors.filter(inv => inv.accountStatus?.includes('Restricted')).length}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Closed Accounts</p>
              <p className="font-bold text-red-600 text-lg">
                {investors.filter(inv => inv.accountStatus?.includes('Closed')).length}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Total AUM</p>
              <p className="font-bold text-purple-600 text-lg">
                ${investors.reduce((sum, inv) => sum + inv.currentBalance, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default InvestorsList;