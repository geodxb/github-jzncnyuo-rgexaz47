import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Investor, Transaction, WithdrawalRequest } from '../types/user';

export class FirestoreService {
  // Enhanced Investors methods - now properly syncing from users collection
  static async getInvestors(): Promise<Investor[]> {
    try {
      console.log('🔥 Firestore: Querying users collection for investors...');
      
      // Query users collection for documents with role 'investor'
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        console.log('⚠️ Firestore: No investor users found in users collection');
        return [];
      }
      
      console.log(`✅ Firestore: Found ${usersSnapshot.size} investor users in users collection`);
      
      // Process and return the investor data directly from users collection
      const investors = this.processUserDocsAsInvestors(usersSnapshot);
      
      // Log each investor for debugging
      investors.forEach(investor => {
        console.log(`👤 Investor: ${investor.name} | Balance: $${investor.currentBalance?.toLocaleString() || '0'} | Status: ${investor.accountStatus || 'Active'} | Email: ${investor.email || 'N/A'}`);
      });
      
      return investors;
      
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch investors from users collection:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Process user documents as investor objects
  private static processUserDocsAsInvestors(usersSnapshot: any): Investor[] {
    const investors = usersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      console.log(`📄 Processing user document as investor: ${doc.id} - ${data.name || 'Unknown'}`);
      console.log(`📄 Account Status: ${data.accountStatus || 'Active'} | Policy Violation: ${data.accountFlags?.policyViolation || false}`);
      
      return {
        id: doc.id,
        // Map all the fields from your users collection structure
        name: data.name || 'Unknown Investor',
        email: data.email || '',
        phone: data.phone || '',
        country: data.country || 'Unknown',
        location: data.location || '',
        joinDate: data.joinDate || new Date().toISOString().split('T')[0],
        initialDeposit: data.initialDeposit || 0,
        currentBalance: data.currentBalance || 0,
        role: 'investor' as const,
        isActive: data.isActive !== false,
        accountType: data.accountType || 'Standard',
        accountStatus: data.accountStatus || 'Active',
        accountFlags: {
          policyViolation: data.accountFlags?.policyViolation || false,
          policyViolationMessage: data.accountFlags?.policyViolationMessage || '',
          pendingKyc: data.accountFlags?.pendingKyc || false,
          kycMessage: data.accountFlags?.kycMessage || '',
          withdrawalDisabled: data.accountFlags?.withdrawalDisabled || false,
          withdrawalMessage: data.accountFlags?.withdrawalMessage || ''
        },
        tradingData: {
          positionsPerDay: data.tradingData?.positionsPerDay || 0,
          pairs: data.tradingData?.pairs || [],
          platform: data.tradingData?.platform || 'IBKR',
          leverage: data.tradingData?.leverage || 100,
          currency: data.tradingData?.currency || 'USD'
        },
        bankDetails: data.bankDetails || {},
        verification: data.verification || {},
        // Handle timestamps properly
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as Investor[];
    
    console.log(`✅ Firestore: Successfully processed ${investors.length} investor records from users collection`);
    return investors;
  }

  // Real-time listener for investors from users collection
  static subscribeToInvestors(callback: (investors: Investor[]) => void): () => void {
    console.log('🔥 Firestore: Setting up real-time listener for investors in users collection...');
    
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
    
    const unsubscribe = onSnapshot(
      usersQuery,
      (querySnapshot) => {
        console.log('🔄 Firestore: Users collection updated, processing investors...');
        const investors = this.processUserDocsAsInvestors(querySnapshot);
        callback(investors);
      },
      (error) => {
        console.error('❌ Firestore Error: Real-time listener failed:', error);
      }
    );

    return unsubscribe;
  }

  static async getInvestorById(id: string): Promise<Investor | null> {
    try {
      console.log(`🔥 Firestore: Fetching investor by ID from users collection: ${id}`);
      
      // Get directly from users collection
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Verify this is an investor
        if (data.role !== 'investor') {
          console.log(`⚠️ Firestore: Document ${id} is not an investor (role: ${data.role})`);
          return null;
        }
        
        console.log(`✅ Firestore: Found investor in users collection: ${data.name || 'Unknown'}`);
        
        return {
          id: docSnap.id,
          name: data.name || 'Unknown Investor',
          email: data.email || '',
          phone: data.phone || '',
          country: data.country || 'Unknown',
          location: data.location || '',
          joinDate: data.joinDate || new Date().toISOString().split('T')[0],
          initialDeposit: data.initialDeposit || 0,
          currentBalance: data.currentBalance || 0,
          role: 'investor' as const,
          isActive: data.isActive !== false,
          accountStatus: data.accountStatus || 'Active',
          accountFlags: data.accountFlags || {},
          tradingData: {
            positionsPerDay: data.tradingData?.positionsPerDay || 0,
            pairs: data.tradingData?.pairs || [],
            platform: data.tradingData?.platform || 'IBKR',
            leverage: data.tradingData?.leverage || 100,
            currency: data.tradingData?.currency || 'USD'
          },
          bankDetails: data.bankDetails || {},
          verification: data.verification || {},
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Investor;
      }
      
      console.log(`⚠️ Firestore: No investor found with ID: ${id}`);
      return null;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch investor by ID:', error);
      throw new Error(`Failed to retrieve investor profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for a single investor
  static subscribeToInvestor(id: string, callback: (investor: Investor | null) => void): () => void {
    console.log(`🔥 Firestore: Setting up real-time listener for investor: ${id}`);
    
    const docRef = doc(db, 'users', id);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        console.log(`🔄 Firestore: Document snapshot received for ${id}:`, docSnapshot.exists());
        
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log(`🔄 Firestore: Raw document data:`, JSON.stringify(data, null, 2));
          
          // Verify this is an investor
          if (data.role !== 'investor') {
            console.log(`⚠️ Firestore: Document ${id} is not an investor (role: ${data.role})`);
            callback(null);
            return;
          }
          
          console.log(`🔄 Firestore: Processing investor data for ${id}`);
          
          const investor: Investor = {
            id: docSnapshot.id,
            name: data.name || 'Unknown Investor',
            email: data.email || '',
            phone: data.phone || '',
            country: data.country || 'Unknown',
            location: data.location || '',
            joinDate: data.joinDate || new Date().toISOString().split('T')[0],
            initialDeposit: data.initialDeposit || 0,
            currentBalance: data.currentBalance || 0,
            role: 'investor' as const,
            isActive: data.isActive !== false,
            accountType: data.accountType || 'Standard',
            accountStatus: data.accountStatus || 'Active',
            accountFlags: {
              policyViolation: data.accountFlags?.policyViolation || false,
              policyViolationMessage: data.accountFlags?.policyViolationMessage || '',
              pendingKyc: data.accountFlags?.pendingKyc || false,
              kycMessage: data.accountFlags?.kycMessage || '',
              withdrawalDisabled: data.accountFlags?.withdrawalDisabled || false,
              withdrawalMessage: data.accountFlags?.withdrawalMessage || '',
              pendingProfileChanges: data.accountFlags?.pendingProfileChanges || false,
              profileChangeMessage: data.accountFlags?.profileChangeMessage || ''
            },
            tradingData: {
              positionsPerDay: data.tradingData?.positionsPerDay || 0,
              pairs: data.tradingData?.pairs || [],
              platform: data.tradingData?.platform || 'IBKR',
              leverage: data.tradingData?.leverage || 100,
              currency: data.tradingData?.currency || 'USD'
            },
            bankDetails: data.bankDetails || {},
            bankAccounts: data.bankAccounts || [],
            verification: data.verification || {},
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
          
          console.log(`✅ Firestore: Processed investor:`, {
            name: investor.name,
            accountStatus: investor.accountStatus,
            accountFlags: investor.accountFlags,
            currentBalance: investor.currentBalance,
            updatedAt: investor.updatedAt.toISOString()
          });
          
          callback(investor);
        } else {
          console.log(`⚠️ Firestore: Investor ${id} not found`);
          callback(null);
        }
      },
      (error) => {
        console.error(`❌ Firestore Error: Real-time listener failed for investor ${id}:`, error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  static async createInvestor(id: string, data: any): Promise<void> {
    try {
      console.log(`🔥 Firestore: Creating investor profile in users collection: ${data.name || 'Unknown'}`);
      const docRef = doc(db, 'users', id);
      
      const investorData = {
        ...data,
        role: 'investor',
        accountType: data.accountType || 'Standard',
        isActive: true,
        accountStatus: data.accountStatus || 'Active',
        email: data.email || '',
        phone: data.phone || '',
        country: data.country || 'Unknown',
        tradingData: data.tradingData || {
          positionsPerDay: 0,
          pairs: [],
          platform: 'IBKR',
          leverage: 100,
          currency: 'USD'
        },
        bankDetails: data.bankDetails || {},
        verification: data.verification || {},
        accountFlags: data.accountFlags || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, investorData);
      console.log(`✅ Firestore: Successfully created investor profile in users collection: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to create investor:', error);
      throw new Error(`Failed to create investor profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateInvestor(id: string, data: Partial<Investor>): Promise<void> {
    try {
      console.log(`🔥 Firestore: Updating investor in users collection: ${id}`);
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully updated investor in users collection: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to update investor:', error);
      throw new Error(`Failed to update investor profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateInvestorBalance(id: string, newBalance: number): Promise<void> {
    try {
      console.log(`🔥 Firestore: Updating balance for investor ${id}: $${newBalance.toLocaleString()}`);
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        currentBalance: newBalance,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully updated balance for investor: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to update investor balance:', error);
      throw new Error(`Failed to update account balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete investor (mark for deletion)
  static async deleteInvestor(id: string, reason: string, adminId: string): Promise<void> {
    try {
      console.log(`🔥 Firestore: Creating account closure request: ${id}`);
      const docRef = doc(db, 'users', id);
      
      // Get investor data first
      const investorDoc = await getDoc(docRef);
      if (!investorDoc.exists()) {
        throw new Error('Investor not found');
      }
      
      const investorData = investorDoc.data();
      
      // Update investor status to show deletion request
      await updateDoc(docRef, {
        accountStatus: 'Deletion Request Under Review',
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Firestore: Successfully updated investor status for closure request: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to create closure request:', error);
      throw new Error(`Failed to create closure request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addCreditToInvestor(investorId: string, amount: number, adminId: string): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding $${amount.toLocaleString()} credit to investor: ${investorId}`);
      
      // Get current investor data from users collection
      const investor = await this.getInvestorById(investorId);
      if (!investor) {
        throw new Error('Investor profile not found');
      }

      // Update balance
      const newBalance = investor.currentBalance + amount;
      await this.updateInvestorBalance(investorId, newBalance);

      // Add transaction record
      await this.addTransaction({
        investorId,
        type: 'Credit',
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: `Credit added by admin ${adminId}`
      });
      
      console.log(`✅ Firestore: Successfully added credit to investor: ${investorId}`);
      console.log(`📊 AUM Impact: +$${amount.toLocaleString()} (New balance: $${newBalance.toLocaleString()})`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add credit to investor:', error);
      throw new Error(`Failed to add credit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Transactions methods with fallback for missing index
  static async getTransactions(investorId?: string): Promise<Transaction[]> {
    try {
      console.log('🔥 Firestore: Querying transactions collection...');
      
      if (investorId) {
        // Try the optimized query first (requires composite index)
        try {
          console.log(`🔥 Firestore: Attempting optimized query for investor: ${investorId}`);
          const q = query(
            collection(db, 'transactions'),
            where('investorId', '==', investorId),
            orderBy('date', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const transactions = this.processTransactionDocs(querySnapshot);
          console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions using optimized query`);
          return transactions;
        } catch (indexError: any) {
          // If the composite index doesn't exist, fall back to filtering approach
          if (indexError.message?.includes('index') || indexError.code === 'failed-precondition') {
            console.log('⚠️ Firestore: Composite index not available, using fallback approach...');
            
            // First get all transactions for the investor (without ordering)
            const q = query(
              collection(db, 'transactions'),
              where('investorId', '==', investorId)
            );
            
            const querySnapshot = await getDocs(q);
            const transactions = this.processTransactionDocs(querySnapshot);
            
            // Sort in memory by date (descending)
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions using fallback approach`);
            return transactions;
          } else {
            // Re-throw if it's a different error
            throw indexError;
          }
        }
      } else {
        // For all transactions, try ordering by date
        try {
          const q = query(
            collection(db, 'transactions'),
            orderBy('date', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const transactions = this.processTransactionDocs(querySnapshot);
          console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions`);
          return transactions;
        } catch (indexError: any) {
          // If ordering fails, get all and sort in memory
          console.log('⚠️ Firestore: Date ordering not available, sorting in memory...');
          const querySnapshot = await getDocs(collection(db, 'transactions'));
          const transactions = this.processTransactionDocs(querySnapshot);
          
          // Sort in memory by date (descending)
          transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          console.log(`✅ Firestore: Successfully retrieved ${transactions.length} transactions with memory sorting`);
          return transactions;
        }
      }
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch transactions:', error);
      throw new Error(`Failed to load transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static processTransactionDocs(querySnapshot: any): Transaction[] {
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        // Ensure required fields
        type: data.type || 'Deposit',
        amount: data.amount || 0,
        status: data.status || 'Completed',
        date: data.date || new Date().toISOString().split('T')[0],
        description: data.description || ''
      };
    }) as Transaction[];
  }

  static async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding ${transaction.type} transaction: $${transaction.amount.toLocaleString()}`);
      
      // For withdrawals, ensure we're tracking the AUM impact correctly
      if (transaction.type === 'Withdrawal') {
        console.log(`📊 AUM Impact: -$${Math.abs(transaction.amount).toLocaleString()} (Withdrawal processed)`);
      } else if (transaction.type === 'Deposit' || transaction.type === 'Earnings' || transaction.type === 'Credit') {
        console.log(`📊 AUM Impact: +$${transaction.amount.toLocaleString()} (${transaction.type} added)`);
      }
      
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully added transaction`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add transaction:', error);
      throw new Error(`Failed to record transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateTransaction(id: string, updates: any): Promise<void> {
    try {
      console.log(`🔥 Firestore: Updating transaction: ${id}`);
      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully updated transaction: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to update transaction:', error);
      throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Withdrawal Requests methods
  static async getWithdrawalRequests(investorId?: string): Promise<WithdrawalRequest[]> {
    try {
      console.log('🔥 Firestore: Querying withdrawal requests collection...', investorId ? `for investor ${investorId}` : 'all requests');
      
      try {
        // Try with ordering first
        let q;
        if (investorId) {
          q = query(
            collection(db, 'withdrawalRequests'),
            where('investorId', '==', investorId),
            orderBy('date', 'desc')
          );
        } else {
          q = query(
            collection(db, 'withdrawalRequests'),
            orderBy('date', 'desc')
          );
        }
        
        const querySnapshot = await getDocs(q);
        const requests = this.processWithdrawalDocs(querySnapshot);
        console.log(`✅ Firestore: Successfully retrieved ${requests.length} withdrawal requests${investorId ? ` for investor ${investorId}` : ''}`);
        return requests;
      } catch (indexError: any) {
        // If ordering fails, get all and sort in memory
        console.log('⚠️ Firestore: Date ordering not available for withdrawals, using fallback approach...');
        
        let q;
        if (investorId) {
          q = query(
            collection(db, 'withdrawalRequests'),
            where('investorId', '==', investorId)
          );
        } else {
          q = collection(db, 'withdrawalRequests');
        }
        
        const querySnapshot = await getDocs(q);
        const requests = this.processWithdrawalDocs(querySnapshot);
        
        // Sort in memory by date (descending)
        requests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`✅ Firestore: Successfully retrieved ${requests.length} withdrawal requests with fallback approach${investorId ? ` for investor ${investorId}` : ''}`);
        return requests;
      }
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch withdrawal requests:', error);
      throw new Error(`Failed to load withdrawal requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static processWithdrawalDocs(querySnapshot: any): WithdrawalRequest[] {
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        processedAt: data.processedAt?.toDate() || null,
        approvalDate: data.approvalDate?.toDate() || null,
        w8benSubmittedAt: data.w8benSubmittedAt?.toDate() || null,
        w8benApprovedAt: data.w8benApprovedAt?.toDate() || null,
        // Ensure required fields
        status: data.status || 'Pending',
        amount: data.amount || 0,
        date: data.date || new Date().toISOString().split('T')[0],
        investorName: data.investorName || 'Unknown Investor',
        w8benStatus: data.w8benStatus || 'not_required'
      };
    }) as WithdrawalRequest[];
  }

  // Real-time listener for withdrawal requests
  static subscribeToWithdrawalRequests(investorId: string | undefined, callback: (requests: WithdrawalRequest[]) => void): () => void {
    console.log('🔥 Firestore: Setting up real-time listener for withdrawal requests...', investorId ? `for investor ${investorId}` : 'all requests');
    
    let q;
    if (investorId) {
      q = query(
        collection(db, 'withdrawalRequests'),
        where('investorId', '==', investorId)
      );
    } else {
      q = collection(db, 'withdrawalRequests');
    }
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log('🔄 Firestore: Withdrawal requests collection updated...');
        const requests = this.processWithdrawalDocs(querySnapshot);
        
        // Sort in memory by date (descending)
        requests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        callback(requests);
      },
      (error) => {
        console.error('❌ Firestore Error: Real-time listener failed for withdrawal requests:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Real-time listener for transactions
  static subscribeToTransactions(investorId: string | undefined, callback: (transactions: Transaction[]) => void): () => void {
    console.log('🔥 Firestore: Setting up real-time listener for transactions...', investorId ? `for investor ${investorId}` : 'all transactions');
    
    let q;
    if (investorId) {
      q = query(
        collection(db, 'transactions'),
        where('investorId', '==', investorId)
      );
    } else {
      q = collection(db, 'transactions');
    }
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log('🔄 Firestore: Transactions collection updated...');
        const transactions = this.processTransactionDocs(querySnapshot);
        
        // Sort in memory by date (descending)
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        callback(transactions);
      },
      (error) => {
        console.error('❌ Firestore Error: Real-time listener failed for transactions:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  static async addWithdrawalRequest(investorId: string, investorName: string, amount: number, withdrawalId?: string): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding withdrawal request: ${investorName} - $${amount.toLocaleString()}`);
      const docData = {
        investorId,
        investorName,
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        approvalDate: null,
        createdAt: serverTimestamp()
      };
      
      if (withdrawalId) {
        // Use specific ID if provided
        const docRef = doc(db, 'withdrawalRequests', withdrawalId);
        await setDoc(docRef, docData);
      } else {
        // Auto-generate ID
        await addDoc(collection(db, 'withdrawalRequests'), docData);
      }
      
      console.log(`✅ Firestore: Successfully added withdrawal request`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add withdrawal request:', error);
      throw new Error(`Failed to submit withdrawal request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateWithdrawalRequest(
    id: string, 
    status: string, 
    processedBy: string, 
    reason?: string
  ): Promise<void> {
    try {
      console.log(`🔥 Firestore: Updating withdrawal request ${id} to ${status}`);
      const docRef = doc(db, 'withdrawalRequests', id);
      
      // Prepare update data
      const updateData: any = {
        status,
        processedBy,
        processedAt: serverTimestamp(),
        reason: reason || null,
        updatedAt: serverTimestamp()
      };
      
      // If status is being changed to 'Approved', set the approval date
      if (status === 'Approved') {
        updateData.approvalDate = serverTimestamp();
        console.log(`✅ Firestore: Setting approval date for withdrawal ${id}`);
      }
      
      await updateDoc(docRef, updateData);

      // If approved, create commission record
      if (status === 'Approved') {
        const requestDoc = await getDoc(docRef);
        if (requestDoc.exists()) {
          const requestData = requestDoc.data();
          await this.addCommission({
            investorId: requestData.investorId,
            investorName: requestData.investorName,
            withdrawalAmount: requestData.amount,
            commissionRate: 15,
            commissionAmount: requestData.amount * 0.15,
            date: new Date().toISOString().split('T')[0],
            status: 'Earned',
            withdrawalId: id
          });
          console.log(`✅ Firestore: Created commission record for withdrawal: ${id}`);
        }
      }
      
      console.log(`✅ Firestore: Successfully updated withdrawal request: ${id}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to update withdrawal request:', error);
      throw new Error(`Failed to process withdrawal request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update W-8 BEN status for withdrawal request
  static async updateW8BenStatus(
    withdrawalId: string,
    status: 'approved' | 'rejected',
    processedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`🔥 Firestore: Updating W-8 BEN status for withdrawal ${withdrawalId} to ${status}`);
      const docRef = doc(db, 'withdrawalRequests', withdrawalId);
      
      const updateData: any = {
        w8benStatus: status,
        updatedAt: serverTimestamp()
      };
      
      if (status === 'approved') {
        updateData.w8benApprovedAt = serverTimestamp();
      } else {
        updateData.w8benRejectionReason = reason || 'Form rejected by compliance team';
      }
      
      await updateDoc(docRef, updateData);
      console.log(`✅ Firestore: Successfully updated W-8 BEN status for withdrawal: ${withdrawalId}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to update W-8 BEN status:', error);
      throw new Error(`Failed to update W-8 BEN status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Commissions methods
  static async getCommissions(): Promise<any[]> {
    try {
      console.log('🔥 Firestore: Querying commissions collection...');
      
      try {
        // Try with ordering first
        const q = query(
          collection(db, 'commissions'),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const commissions = this.processCommissionDocs(querySnapshot);
        console.log(`✅ Firestore: Successfully retrieved ${commissions.length} commission records`);
        return commissions;
      } catch (indexError: any) {
        // If ordering fails, get all and sort in memory
        console.log('⚠️ Firestore: Date ordering not available for commissions, sorting in memory...');
        const querySnapshot = await getDocs(collection(db, 'commissions'));
        const commissions = this.processCommissionDocs(querySnapshot);
        
        // Sort in memory by date (descending)
        commissions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`✅ Firestore: Successfully retrieved ${commissions.length} commission records with memory sorting`);
        return commissions;
      }
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch commissions:', error);
      throw new Error(`Failed to load commission data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static processCommissionDocs(querySnapshot: any): any[] {
    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        // Ensure required fields
        commissionAmount: data.commissionAmount || 0,
        commissionRate: data.commissionRate || 15,
        status: data.status || 'Earned',
        investorName: data.investorName || 'Unknown Investor'
      };
    });
  }

  static async addCommission(commission: any): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding commission: $${commission.commissionAmount.toLocaleString()}`);
      await addDoc(collection(db, 'commissions'), {
        ...commission,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully added commission record`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add commission:', error);
      throw new Error(`Failed to record commission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async addCommissionWithdrawalRequest(request: any): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding commission withdrawal request: $${request.amount.toLocaleString()}`);
      await addDoc(collection(db, 'commissionWithdrawals'), {
        ...request,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully added commission withdrawal request`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add commission withdrawal request:', error);
      throw new Error(`Failed to submit commission withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Support credentials management
  static async storeSupportCredentials(userId: string, credentials: {
    name: string;
    email: string;
    clientId: string;
  }): Promise<void> {
    try {
      console.log(`🔥 Firestore: Storing support credentials for user: ${userId}`);
      const docRef = doc(db, 'supportCredentials', userId);
      await setDoc(docRef, {
        ...credentials,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully stored support credentials for user: ${userId}`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to store support credentials:', error);
      throw new Error(`Failed to store support credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify user exists in Firestore by email
  static async verifyUserByEmail(email: string): Promise<any | null> {
    try {
      console.log(`🔥 Firestore: Verifying user exists with email: ${email}`);
      
      // Query users collection for this email
      const q = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        console.log(`✅ Firestore: User found with email ${email}, role: ${data.role}`);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }
      
      console.log(`⚠️ Firestore: No user found with email: ${email}`);
      return null;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to verify user by email:', error);
      throw new Error(`Failed to verify user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  static async getSupportCredentials(userId: string): Promise<any | null> {
    try {
      console.log(`🔥 Firestore: Fetching support credentials for user: ${userId}`);
      const docRef = doc(db, 'supportCredentials', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ Firestore: Found support credentials for user: ${userId}`);
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }
      
      console.log(`⚠️ Firestore: No support credentials found for user: ${userId}`);
      return null;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch support credentials:', error);
      throw new Error(`Failed to retrieve support credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async verifySupportCredentials(name: string, email: string, clientId: string): Promise<any | null> {
    try {
      console.log(`🔥 Firestore: Verifying support credentials for: ${name}`);
      
      // Query support credentials collection
      const q = query(
        collection(db, 'supportCredentials'),
        where('name', '==', name),
        where('email', '==', email),
        where('clientId', '==', clientId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        console.log(`✅ Firestore: Support credentials verified for: ${name}`);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }
      
      console.log(`⚠️ Firestore: Support credentials verification failed for: ${name}`);
      return null;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to verify support credentials:', error);
      throw new Error(`Failed to verify support credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Profile change request management
  static async addProfileChangeRequest(request: any): Promise<void> {
    try {
      console.log(`🔥 Firestore: Adding profile change request for investor: ${request.investorName}`);
      await addDoc(collection(db, 'profileChangeRequests'), {
        ...request,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firestore: Successfully added profile change request`);
    } catch (error) {
      console.error('❌ Firestore Error: Failed to add profile change request:', error);
      throw new Error(`Failed to submit profile changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility methods
  static async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      console.log(`🔥 Firestore: Deleting document from ${collectionName}: ${id}`);
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      console.log(`✅ Firestore: Successfully deleted document: ${id}`);
    } catch (error) {
      console.error(`❌ Firestore Error: Failed to delete document from ${collectionName}:`, error);
      throw new Error(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getDocumentCount(collectionName: string): Promise<number> {
    try {
      console.log(`🔥 Firestore: Counting documents in ${collectionName}...`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      const count = querySnapshot.size;
      console.log(`✅ Firestore: Found ${count} documents in ${collectionName}`);
      return count;
    } catch (error) {
      console.error(`❌ Firestore Error: Failed to count documents in ${collectionName}:`, error);
      throw new Error(`Failed to count records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Search and filtering methods
  static async searchInvestors(searchTerm: string): Promise<Investor[]> {
    try {
      console.log(`🔥 Firestore: Searching investors for term: "${searchTerm}"`);
      const investors = await this.getInvestors();
      const filtered = investors.filter(investor => 
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`✅ Firestore: Found ${filtered.length} matching investors`);
      return filtered;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to search investors:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getInvestorsByStatus(status: string): Promise<Investor[]> {
    try {
      console.log(`🔥 Firestore: Fetching investors with status: ${status}`);
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'investor'),
        where('accountStatus', '==', status)
      );
      
      const querySnapshot = await getDocs(q);
      const investors = this.processUserDocsAsInvestors(querySnapshot);
      
      console.log(`✅ Firestore: Found ${investors.length} investors with status: ${status}`);
      return investors;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch investors by status:', error);
      throw new Error(`Failed to filter by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analytics helpers
  static async getTotalInvestorBalance(): Promise<number> {
    try {
      console.log('🔥 Firestore: Calculating total investor balance...');
      const investors = await this.getInvestors();
      const total = investors.reduce((total, investor) => total + investor.currentBalance, 0);
      console.log(`✅ Firestore: Total AUM: $${total.toLocaleString()}`);
      return total;
    } catch (error) {
      console.error('❌ Firestore Error: Failed to calculate total investor balance:', error);
      throw new Error(`Failed to calculate total balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getRecentTransactions(limitCount: number = 10): Promise<Transaction[]> {
    try {
      console.log(`🔥 Firestore: Fetching ${limitCount} most recent transactions...`);
      
      try {
        // Try with ordering and limit first
        const q = query(
          collection(db, 'transactions'),
          orderBy('date', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const transactions = this.processTransactionDocs(querySnapshot);
        console.log(`✅ Firestore: Retrieved ${transactions.length} recent transactions`);
        return transactions;
      } catch (indexError: any) {
        // If ordering fails, get all, sort in memory, and limit
        console.log('⚠️ Firestore: Date ordering not available, using fallback approach...');
        const querySnapshot = await getDocs(collection(db, 'transactions'));
        const transactions = this.processTransactionDocs(querySnapshot);
        
        // Sort in memory by date (descending) and limit
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const limitedTransactions = transactions.slice(0, limitCount);
        
        console.log(`✅ Firestore: Retrieved ${limitedTransactions.length} recent transactions with fallback approach`);
        return limitedTransactions;
      }
    } catch (error) {
      console.error('❌ Firestore Error: Failed to fetch recent transactions:', error);
      throw new Error(`Failed to load recent transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}