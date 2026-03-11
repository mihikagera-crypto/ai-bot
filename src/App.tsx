/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const SYSTEM_INSTRUCTION = `You are a helpful chatbot for a website.
Your job is to answer user questions in a simple and friendly way.

Guidelines:
- Respond politely and clearly.
- Keep answers short and easy to understand.
- If you don't know the answer, say "I'm sorry, I don't have that information right now."
- Help users with basic questions about the website.
- The website is a general information platform that provides support and resources for its community.

Example behavior:
User: Hello
Bot: Hi! How can I help you today?

User: What does this website do?
Bot: This website provides information and support for users.

User: Thank you
Bot: You're welcome! Let me know if you need anything else.`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: 'Hi! How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: input.trim() }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: response.text || "I'm sorry, I don't have that information right now.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I'm sorry, I'm having a little trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl chat-shadow overflow-hidden flex flex-col h-[80vh]">
        {/* Header */}
        <header className="px-6 py-4 border-bottom border-zinc-100 flex items-center gap-3 bg-white z-10">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900">Friendly Bot</h1>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online and ready to help
            </p>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    message.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    message.role === 'user' 
                      ? 'bg-zinc-900 text-white rounded-tr-none' 
                      : 'bg-zinc-100 text-zinc-800 rounded-tl-none'
                  }`}>
                    {message.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 items-center text-zinc-400">
                <div className="w-8 h-8 rounded-full bg-emerald-50/50 flex items-center justify-center text-emerald-400">
                  <Bot size={16} />
                </div>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs font-medium">Bot is thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <footer className="p-6 border-top border-zinc-100 bg-zinc-50/50">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-zinc-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
          <p className="text-[10px] text-center text-zinc-400 mt-3 uppercase tracking-wider font-medium">
            Powered by Gemini AI • Friendly Support
          </p>
        </footer>
      </div>
    </div>
  );
}
