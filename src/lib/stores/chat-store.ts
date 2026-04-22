import { create } from "zustand";

interface Channel {
  _id: string;
  name?: string;
  type: "public" | "private" | "dm";
  members: any[];
  lastMessageAt?: string;
  hasUnread?: boolean;
}

interface Message {
  _id: string;
  channelId: string;
  senderId: any;
  content: string;
  createdAt: string;
  threadParentId?: string;
  replyCount?: number;
  reactions?: any[];
  attachments?: any[];
  isPinned?: boolean;
  isEdited?: boolean;
}

interface ChatState {
  activeChannelId: string | null;
  activeThreadMessageId: string | null;
  channels: Channel[];
  messages: Record<string, Message[]>; // Keyed by channelId
  threads: Record<string, Message[]>; // Keyed by threadParentId
  
  setActiveChannel: (id: string | null) => void;
  setActiveThread: (id: string | null) => void;
  setChannels: (channels: Channel[]) => void;
  setMessages: (channelId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setThreadMessages: (threadId: string, messages: Message[]) => void;
  addThreadMessage: (message: Message) => void;
  updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (channelId: string, messageId: string) => void;
  markChannelRead: (channelId: string) => void;
  toggleReaction: (channelId: string, messageId: string, emoji: string, userId: string) => void;
  togglePin: (channelId: string, messageId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChannelId: null,
  activeThreadMessageId: null,
  channels: [],
  messages: {},
  threads: {},

  setActiveChannel: (id) => set({ activeChannelId: id, activeThreadMessageId: null }),
  setActiveThread: (id) => set({ activeThreadMessageId: id }),
  
  setChannels: (channels) => set({ channels }),
  
  setMessages: (channelId, messages) => 
    set((state) => ({
      messages: { ...state.messages, [channelId]: messages }
    })),
    
  addMessage: (message) =>
    set((state) => {
      const channelId = message.channelId;
      const current = state.messages[channelId] || [];
      // Prevent duplicates
      if (current.some(m => m._id === message._id)) return state;
      return {
        messages: { ...state.messages, [channelId]: [...current, message] }
      };
    }),
    
  setThreadMessages: (threadId, messages) =>
    set((state) => ({
      threads: { ...state.threads, [threadId]: messages }
    })),
    
  addThreadMessage: (message) =>
    set((state) => {
      if (!message.threadParentId) return state;
      const threadId = message.threadParentId;
      const current = state.threads[threadId] || [];
      if (current.some(m => m._id === message._id)) return state;
      const channelId = message.channelId;
      const channelMessages = state.messages[channelId] || [];
      const updatedMessages = channelMessages.map(m => 
        m._id === threadId ? { ...m, replyCount: (m.replyCount || 0) + 1 } : m
      );

      return {
        threads: { ...state.threads, [threadId]: [...current, message] },
        messages: { ...state.messages, [channelId]: updatedMessages }
      };
    }),
    
  updateMessage: (channelId, messageId, updates) =>
    set((state) => {
      const channelMessages = state.messages[channelId] || [];
      const updatedMessages = channelMessages.map(m => (m._id === messageId ? { ...m, ...updates } : m));
      
      const updatedThreads = { ...state.threads };
      Object.keys(updatedThreads).forEach(threadId => {
        updatedThreads[threadId] = updatedThreads[threadId].map(m => (m._id === messageId ? { ...m, ...updates } : m));
      });

      return {
        messages: { ...state.messages, [channelId]: updatedMessages },
        threads: updatedThreads
      };
    }),
    
  deleteMessage: (channelId, messageId) =>
    set((state) => {
      const channelMessages = state.messages[channelId] || [];
      const updatedMessages = channelMessages.filter(m => m._id !== messageId);

      const updatedThreads = { ...state.threads };
      let parentIdToUpdate: string | null = null;

      Object.keys(updatedThreads).forEach(threadId => {
        const initialCount = updatedThreads[threadId].length;
        updatedThreads[threadId] = updatedThreads[threadId].filter(m => m._id !== messageId);
        if (updatedThreads[threadId].length < initialCount) {
          parentIdToUpdate = threadId;
        }
      });

      // If we deleted a thread message, update parent's replyCount
      if (parentIdToUpdate) {
        const msgList = updatedMessages.map(m => 
          m._id === parentIdToUpdate ? { ...m, replyCount: Math.max(0, (m.replyCount || 1) - 1) } : m
        );
        return {
          messages: { ...state.messages, [channelId]: msgList },
          threads: updatedThreads
        };
      }

      return {
        messages: { ...state.messages, [channelId]: updatedMessages },
        threads: updatedThreads
      };
    }),
    
  markChannelRead: (channelId) =>
    set((state) => ({
      channels: state.channels.map(c => 
        c._id === channelId ? { ...c, hasUnread: false } : c
      )
    })),

  toggleReaction: (channelId, messageId, emoji, userId) =>
    set((state) => {
      const updateReactionList = (reactions: any[]) => {
        const newReactions = [...(reactions || [])];
        const reactionIndex = newReactions.findIndex(r => r.emoji === emoji);
        
        if (reactionIndex > -1) {
          const users = [...newReactions[reactionIndex].users];
          const userIndex = users.indexOf(userId);
          if (userIndex > -1) {
            newReactions[reactionIndex].users = users.filter(id => id !== userId);
            if (newReactions[reactionIndex].users.length === 0) {
              newReactions.splice(reactionIndex, 1);
            }
          } else {
            newReactions[reactionIndex].users = [...users, userId];
          }
        } else {
          newReactions.push({ emoji, users: [userId] });
        }
        return newReactions;
      };

      // Update main messages
      const channelMessages = state.messages[channelId] || [];
      const updatedMessages = channelMessages.map(m => 
        m._id === messageId ? { ...m, reactions: updateReactionList(m.reactions || []) } : m
      );

      // Update threads
      const updatedThreads = { ...state.threads };
      Object.keys(updatedThreads).forEach(threadId => {
        updatedThreads[threadId] = updatedThreads[threadId].map(m => 
          m._id === messageId ? { ...m, reactions: updateReactionList(m.reactions || []) } : m
        );
      });

      return {
        messages: { ...state.messages, [channelId]: updatedMessages },
        threads: updatedThreads
      };
    }),

  togglePin: (channelId, messageId) =>
    set((state) => {
      const current = state.messages[channelId] || [];
      return {
        messages: {
          ...state.messages,
          [channelId]: current.map(m => 
            m._id === messageId ? { ...m, isPinned: !m.isPinned } : m
          )
        }
      };
    })
}));
