import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import { useInvestors } from '../../hooks/useFirestore';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, TrendingUp, Plus, Search } from 'lucide-react';

const ManualCreditingPanel = () => {
  const { user } = useAuth();
  const { investors, refetch } = useInvestors();
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [creditType, setCreditType] = useState<'deposit' | 'earnings'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvestors = investors.filter(inv =>
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvestor || !amount || !user) {
      setError('Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const investor = investors.find(inv => inv.id === selectedInvestor);
      if (!investor) {
        throw new Error('Investor not found');
      }

      // Update investor balance
      const newBalance = investor.currentBalance + numAmount;
      await FirestoreService.updateInvestorBalance(selectedInvestor, newBalance);

      // Add transaction record
      await FirestoreService.addTransaction({
        investorId: selectedInvestor,
        type: creditType === 'deposit' ? 'Deposit' : 'Earnings',
        amount: numAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: description || `Manual ${creditType} by admin`
      });

      console.log(`📊 Manual Credit AUM Impact: +$${numAmount.toLocaleString()} (${creditType} to ${investor.name})`);
      console.log(`📊 New investor balance: $${newBalance.toLocaleString()}`);
      
      setIsSuccess(true);
      setAmount('');
      setDescription('');
      setSelectedInvestor('');
      
      // Refresh investor data
      await refetch();

      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);

    } catch (error: any) {
      console.error('Error adding credit:', error);
      setError(error.message || 'Failed to add credit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 5000, 10000];

  return (
    <Card title="Manual Crediting Panel" className="h-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Investor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Investor
          </label>
          <div className="relative mb-2">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search investors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedInvestor}
            onChange={(e) => setSelectedInvestor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Choose an investor...</option>
            {filteredInvestors.map((investor) => (
              <option key={investor.id} value={investor.id}>
                {investor.name} - {investor.country} (${investor.currentBalance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Credit Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credit Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCreditType('deposit')}
              className={`p-3 rounded-lg border-2 transition-all ${
                creditType === 'deposit'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <DollarSign size={20} className="mx-auto mb-1" />
              <span className="text-sm font-medium">Deposit</span>
            </button>
            <button
              type="button"
              onClick={() => setCreditType('earnings')}
              className={`p-3 rounded-lg border-2 transition-all ${
                creditType === 'earnings'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TrendingUp size={20} className="mx-auto mb-1" />
              <span className="text-sm font-medium">Earnings</span>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (USD)
          </label>
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors border border-blue-200"
              >
                ${quickAmount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Enter a description for this transaction..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
          >
            Credit added successfully!
          </motion.div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          <Plus size={18} className="mr-2" />
          Add {creditType === 'deposit' ? 'Deposit' : 'Earnings'}
        </Button>
      </form>

      {/* Quick Stats */}
      {selectedInvestor && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          {(() => {
            const investor = investors.find(inv => inv.id === selectedInvestor);
            if (!investor) return null;
            
            return (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">Investor Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600">Current Balance</p>
                    <p className="font-semibold text-blue-900">${investor.currentBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Initial Deposit</p>
                    <p className="font-semibold text-blue-900">${investor.initialDeposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Total Gain/Loss</p>
                    <p className={`font-semibold ${
                      investor.currentBalance >= investor.initialDeposit ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${(investor.currentBalance - investor.initialDeposit).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600">Account Status</p>
                    <p className="font-semibold text-blue-900">{investor.accountStatus || 'Active'}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
};

export default ManualCreditingPanel;