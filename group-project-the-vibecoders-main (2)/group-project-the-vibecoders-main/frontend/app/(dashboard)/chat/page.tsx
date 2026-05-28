'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Sparkles, 
  Paperclip, 
  Bot, 
  User, 
  Info,
  Plus,
  MessageSquare,
  Loader2,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import chatbotService from '@/lib/services/chatbot.service';
import { SectionSummary, MessageResponse } from '@/types/chatbot';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatPage() {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sections on mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoadingSections(true);
        const data = await chatbotService.getSections();
        // Sort by date descending
        const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSections(sorted);
        if (sorted.length > 0) {
          setActiveSectionId(sorted[0].section_id);
        }
      } catch (error: any) {
        console.error("Failed to fetch sections", error);
        toast({
          title: "Error",
          description: "Failed to load chat history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSections(false);
      }
    };
    fetchSections();
  }, []);

  // Load messages when active section changes
  useEffect(() => {
    if (!activeSectionId) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const detail = await chatbotService.getSectionDetail(activeSectionId);
        setMessages(detail.messages);
      } catch (error: any) {
        console.error("Failed to fetch section detail", error);
        toast({
          title: "Error",
          description: "Failed to load messages for this chat.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeSectionId]);

  const handleCreateSection = async () => {
    try {
      setIsLoadingSections(true);
      const newSection = await chatbotService.createSection();
      setSections(prev => [newSection, ...prev]);
      setActiveSectionId(newSection.section_id);
    } catch (error: any) {
      console.error("Failed to create new section", error);
      toast({
        title: "Error",
        description: "Failed to start a new chat.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSections(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeSectionId || isSending) return;
    
    const userMsg: MessageResponse = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue('');
    setIsSending(true);

    try {
      const response = await chatbotService.sendChatMessage({
        message: currentInput,
        section_id: activeSectionId
      });
      
      const aiMsg: MessageResponse = {
        role: 'ai',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Failed to send message", error);
      toast({
        title: "Error",
        description: error?.response?.data?.detail || error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // restore input on error
      setInputValue(currentInput);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteSection = async (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatbotService.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.section_id !== sectionId));
      if (activeSectionId === sectionId) {
        setActiveSectionId(null);
      }
      toast({ title: "Success", description: "Chat deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete chat.", variant: "destructive" });
    }
  };

  const startRename = (section: SectionSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSectionId(section.section_id);
    setEditingName(section.name || `Chat ${shortId(section.section_id)}`);
  };

  const submitRename = async (sectionId: string) => {
    if (!editingName.trim()) {
      setEditingSectionId(null);
      return;
    }
    try {
      const updated = await chatbotService.updateSectionName(sectionId, editingName);
      setSections(prev => prev.map(s => s.section_id === sectionId ? { ...s, name: updated.name } : s));
      setEditingSectionId(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to rename chat.", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const shortId = (id: string) => {
    return id.split('-')[0] || id.substring(0, 8);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* ── SIDEBAR ── */}
      <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-900 flex flex-col z-20">
        <div className="p-4">
          <Button 
            onClick={handleCreateSection}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
          {isLoadingSections ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center text-slate-500 text-sm mt-10">
              No previous chats.
            </div>
          ) : (
            sections.map(section => (
              <button
                key={section.section_id}
                onClick={() => setActiveSectionId(section.section_id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  activeSectionId === section.section_id
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    activeSectionId === section.section_id ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingSectionId === section.section_id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitRename(section.section_id);
                          if (e.key === 'Escape') setEditingSectionId(null);
                        }}
                        onBlur={() => submitRename(section.section_id)}
                        autoFocus
                        className="h-6 text-sm py-0 px-1 border-teal-500/50 focus-visible:ring-1 focus-visible:ring-teal-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className={`text-sm font-medium truncate ${
                        activeSectionId === section.section_id ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {section.name || `Chat ${shortId(section.section_id)}`}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {formatDate(section.date)}
                    </p>
                  </div>
                  
                  {/* Kebab Menu */}
                  <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => startRename(section, e as any)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDeleteSection(section.section_id, e as any)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 z-10">
        {/* ── HEADER ── */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-200/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">BudgetMate AI Assistant</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Online • Real-time Data
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-teal-600"><Info className="w-5 h-5" /></Button>
          </div>
        </div>

        {/* ── CHAT CONTENT ── */}
        {!isLoadingSections && sections.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-teal-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Welcome to BudgetMate AI</h2>
            <p className="text-slate-500 max-w-md mb-8">
              I can review your transactions, analyze spending trends, and help you create custom budgets. Let's get started!
            </p>
            <Button 
              onClick={handleCreateSection}
              size="lg"
              className="bg-teal-500 hover:bg-teal-600 text-white rounded-full px-8 shadow-lg shadow-teal-200/50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Start New Chat
            </Button>
          </div>
        ) : (
          <>
            {/* ── CHAT HISTORY ── */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 custom-scrollbar">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-4 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                          message.role === 'ai' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400' : 'bg-slate-800 text-white'
                        }`}>
                          {message.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>

                        {/* Message Body */}
                        <div className={`space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`p-4 rounded-2xl shadow-sm text-sm lg:text-base ${
                            message.role === 'ai' 
                              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700' 
                              : 'bg-teal-500 text-white rounded-tr-none'
                          }`}>
                            <div 
                              className={message.role === 'ai' ? "prose prose-sm dark:prose-invert prose-teal max-w-none" : "whitespace-pre-wrap"}
                              dangerouslySetInnerHTML={{ __html: message.content }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 ml-1">{formatDate(message.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="flex gap-4 max-w-[85%]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shadow-sm">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* ── INPUT BAR ── */}
            <div className="p-4 lg:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:bg-white transition-all duration-300">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-teal-600 rounded-xl h-10 w-10 shrink-0">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me to 'analyze groceries' or 'review utilities'..." 
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-slate-700 dark:text-slate-200 h-10"
                  disabled={isSending || !activeSectionId}
                />
                <Button 
                  onClick={handleSend}
                  disabled={isSending || !inputValue.trim() || !activeSectionId}
                  className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-10 w-10 p-0 shadow-lg shadow-teal-200/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
