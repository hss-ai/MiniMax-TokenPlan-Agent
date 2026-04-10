import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { getStorageConfig } from '@/lib/storageAdapter';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface ChatStoreState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  createSession: () => void;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'createdAt'>) => void;
}

const MAX_SESSIONS = 40;

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,

      createSession: () => {
        const newSession: ChatSession = {
          id: uuidv4(),
          title: '新对话',
          messages: [
            {
              id: uuidv4(),
              role: 'bot',
              content: '你好！我是基于 MiniMax API 的多模态助手。请先在左下角设置您的 API Key，然后开始对话。',
              createdAt: Date.now(),
            }
          ],
          updatedAt: Date.now(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions].slice(0, MAX_SESSIONS),
          activeSessionId: newSession.id,
        }));
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      deleteSession: (id) => set((state) => {
        const newSessions = state.sessions.filter(s => s.id !== id);
        return {
          sessions: newSessions,
          activeSessionId: state.activeSessionId === id 
            ? (newSessions[0]?.id || null) 
            : state.activeSessionId
        };
      }),

      addMessage: (sessionId, message) => set((state) => {
        const newSessions = state.sessions.map(session => {
          if (session.id === sessionId) {
            // 如果是用户的第一条消息，更新会话标题
            let newTitle = session.title;
            if (message.role === 'user' && session.messages.length <= 1) {
              newTitle = message.content.slice(0, 15) + (message.content.length > 15 ? '...' : '');
            }
            
            return {
              ...session,
              title: newTitle,
              messages: [
                ...session.messages,
                { ...message, id: uuidv4(), createdAt: Date.now() }
              ],
              updatedAt: Date.now(),
            };
          }
          return session;
        });

        // 将更新的会话移到最前面
        const updatedSession = newSessions.find(s => s.id === sessionId);
        const otherSessions = newSessions.filter(s => s.id !== sessionId);

        return {
          sessions: updatedSession ? [updatedSession, ...otherSessions] : newSessions
        };
      }),
    }),
    {
      name: 'minimax-chat-sessions',
      storage: createJSONStorage(() => getStorageConfig()),
    }
  )
);
