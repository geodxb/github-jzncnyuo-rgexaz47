import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AffiliateMessage, Conversation } from '../types/message';

export class MessageService {
  // Send a new message
  static async sendMessage(
    senderId: string,
    senderName: string,
    senderRole: 'admin' | 'affiliate',
    content: string,
    conversationId?: string,
    replyTo?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<string> {
    try {
      console.log('📨 Sending message from:', senderName, 'Role:', senderRole);
      
      // If no conversation ID provided, create or find existing conversation
      let finalConversationId = conversationId;
      if (!conversationId) {
        finalConversationId = await this.getOrCreateConversation(senderId, senderName, senderRole);
      }
      
      const messageData = {
        senderId,
        senderName,
        senderRole,
        content,
        timestamp: serverTimestamp(),
        conversationId: finalConversationId,
        replyTo: replyTo || null,
        priority,
        status: 'sent',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'affiliateMessages'), messageData);
      
      // Update conversation with last message
      await this.updateConversationLastMessage(finalConversationId, content);
      
      console.log('✅ Message sent successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get or create conversation between admin and affiliate
  static async getOrCreateConversation(
    userId: string, 
    userName: string, 
    userRole: 'admin' | 'affiliate'
  ): Promise<string> {
    try {
      console.log('🔍 Finding or creating conversation for:', userName);
      
      // Look for existing conversation
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      if (!conversationsSnapshot.empty) {
        const existingConversation = conversationsSnapshot.docs[0];
        console.log('✅ Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }
      
      // Create new conversation
      // Get the actual admin user ID from Firebase
      const adminQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        where('email', '==', 'crisdoraodxb@gmail.com')
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      let adminId = 'admin_fallback';
      let adminName = 'Cristian Dorao';
      
      if (!adminSnapshot.empty) {
        const adminDoc = adminSnapshot.docs[0];
        adminId = adminDoc.id;
        adminName = adminDoc.data().name || 'Cristian Dorao';
        console.log('✅ Found admin user:', adminId, adminName);
      } else {
        console.log('⚠️ Admin user not found, using fallback');
      }
      
      const conversationData = {
        participants: userRole === 'admin' ? [userId, adminId] : [adminId, userId],
        participantNames: userRole === 'admin' ? [userName, adminName] : [adminName, userName],
        participantRoles: userRole === 'admin' ? ['admin', 'admin'] : ['admin', 'investor'],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        adminId: adminId,
        affiliateId: userRole === 'admin' ? userId : userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      console.log('✅ Created new conversation:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update conversation with last message
  static async updateConversationLastMessage(conversationId: string, lastMessage: string): Promise<void> {
    try {
      const docRef = doc(db, 'conversations', conversationId);
      await updateDoc(docRef, {
        lastMessage: lastMessage.substring(0, 100), // Truncate for preview
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating conversation:', error);
    }
  }

  // Get messages for a conversation
  static async getMessages(conversationId: string): Promise<AffiliateMessage[]> {
    try {
      console.log('📨 Fetching messages for conversation:', conversationId);
      
      const messagesQuery = query(
        collection(db, 'affiliateMessages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const messages = messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as AffiliateMessage[];
      
      console.log(`✅ Retrieved ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw new Error(`Failed to load messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for messages
  static subscribeToMessages(
    conversationId: string, 
    callback: (messages: AffiliateMessage[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time listener for messages in conversation:', conversationId);
    
    const messagesQuery = query(
      collection(db, 'affiliateMessages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      messagesQuery,
      (querySnapshot) => {
        console.log('🔄 Messages updated in real-time');
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date()
          };
        }) as AffiliateMessage[];
        
        callback(messages);
      },
      (error) => {
        console.error('❌ Real-time listener failed for messages:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }
  // Get conversations for a user
  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log('💬 Fetching conversations for user:', userId);
      
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const conversations = conversationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Conversation[];
      
      console.log(`✅ Retrieved ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      throw new Error(`Failed to load conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for conversations
  static subscribeToConversations(
    userId: string, 
    callback: (conversations: Conversation[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time listener for conversations for user:', userId);
    
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      conversationsQuery,
      (querySnapshot) => {
        console.log('🔄 Conversations updated in real-time');
        const conversations = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        }) as Conversation[];
        
        callback(conversations);
      },
      (error) => {
        console.error('❌ Real-time listener failed for conversations:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

}