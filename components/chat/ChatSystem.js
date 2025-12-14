import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  MessageCircle, Send, Search, User, ArrowLeft, Check, CheckCheck, 
  Loader, Trash2, MoreVertical, CornerUpLeft
} from 'lucide-react';

export default function ChatSystem({ currentUser, initialChatId }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Menu States
  const [activeMessageMenu, setActiveMessageMenu] = useState(null); 
  
  const messagesEndRef = useRef(null);
  const lastHandledIdRef = useRef(null); 
  const [activeTab, setActiveTab] = useState('chats'); 

  useEffect(() => {
    if (currentUser) {
        fetchConversations();
        fetchAllUsers();
    }
    
    // Close dropdowns on click outside
    const handleClickOutside = () => setActiveMessageMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [currentUser]);

  // Real-time Subscription for new messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${selectedConversation.id}` 
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        markMessagesAsRead(selectedConversation.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Smart Auto-Select Logic
  useEffect(() => {
    if (initialChatId && conversations.length > 0 && lastHandledIdRef.current !== initialChatId) {
      const targetChat = conversations.find(c => c.id === initialChatId);
      if (targetChat) {
        setSelectedConversation(targetChat);
        lastHandledIdRef.current = initialChatId;
      }
    }
  }, [conversations, initialChatId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- DIRECT DATABASE FETCHING (Bypasses API) ---

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // 1. Get raw conversations
      const { data: rawConvs, error } = await supabase
        .from('conversations')
        .select(`
            *,
            user1:user1_id(id, username, avatar_url, role),
            user2:user2_id(id, username, avatar_url, role)
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Filter deleted
      const visibleConvs = rawConvs.filter(c => 
        !c.deleted_by || !c.deleted_by.includes(currentUser.id)
      );

      // 3. Enrich with last message
      const enriched = await Promise.all(visibleConvs.map(async (conv) => {
         const otherUser = conv.user1.id === currentUser.id ? conv.user2 : conv.user1;
         
         // Get last message
         const { data: lastMsgs } = await supabase
            .from('messages')
            .select('content, created_at, deleted_by')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(5); // Fetch a few to handle deleted ones

         const validLastMsg = lastMsgs?.find(m => !m.deleted_by || !m.deleted_by.includes(currentUser.id));

         // Get unread count
         const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_id', otherUser.id)
            .eq('read', false);

         return {
            id: conv.id,
            otherUser,
            lastMessage: validLastMsg?.content || 'No messages yet',
            lastMessageTime: validLastMsg?.created_at || conv.created_at,
            unreadCount: count || 0
         };
      }));

      setConversations(enriched);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles') // Assuming your table is 'profiles', change to 'users' if needed
        .select('id, username, avatar_url, role')
        .neq('id', currentUser.id);
        
      if (data) setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const visible = data.filter(m => 
        !m.deleted_by || !m.deleted_by.includes(currentUser.id)
      );
      setMessages(visible);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.id)
        .eq('read', false);
        
      // Update local badge count
      setConversations(prev => prev.map(c => 
         c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  // --- ACTIONS ---

  const deleteConversation = async () => {
    if(!selectedConversation || !window.confirm("Delete this conversation?")) return;
    
    try {
        const { error } = await supabase.rpc('delete_conversation_for_user', {
            conv_id: selectedConversation.id,
            user_id: currentUser.id
        });
        if (error) throw error;
        setSelectedConversation(null);
        fetchConversations();
    } catch (error) {
        console.error("Failed to delete:", error);
    }
  };

  const deleteMessage = async (messageId, mode) => {
    try {
        // Optimistic
        if (mode === 'me') {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } else {
            setMessages(prev => prev.map(m => 
                m.id === messageId ? { ...m, is_unsent: true, content: '🚫 This message was unsent' } : m
            ));
        }

        if (mode === 'everyone') {
             await supabase.rpc('unsend_message', { msg_id: messageId, user_id: currentUser.id });
        } else {
             await supabase.rpc('delete_message_for_user', { msg_id: messageId, user_id: currentUser.id });
        }
        fetchConversations();
    } catch (error) {
        console.error("Failed to delete message", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: selectedConversation.id,
            sender_id: currentUser.id,
            content: newMessage.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update handled by Subscription, but fallback here:
      if (!messages.find(m => m.id === data.id)) {
          setMessages([...messages, data]);
      }
      
      setNewMessage('');
      fetchConversations(); // Update snippet
    } catch (error) {
      console.error('Error sending:', error);
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = async (otherUserId) => {
    try {
      // Check existing
      const { data: existing } = await supabase
        .from('conversations')
        .select(`
            *,
            user1:user1_id(*),
            user2:user2_id(*)
        `)
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (existing) {
         // reconstruct the object shape we expect
         const otherUser = existing.user1.id === currentUser.id ? existing.user2 : existing.user1;
         setSelectedConversation({
             id: existing.id,
             otherUser,
             lastMessage: '',
             unreadCount: 0
         });
      } else {
         // Create new
         const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({ user1_id: currentUser.id, user2_id: otherUserId })
            .select(`*, user1:user1_id(*), user2:user2_id(*)`)
            .single();
            
         if (error) throw error;
         
         const otherUser = newConv.user1.id === currentUser.id ? newConv.user2 : newConv.user1;
         const formatted = {
             id: newConv.id,
             otherUser,
             lastMessage: 'New conversation',
             unreadCount: 0
         };
         
         setConversations([formatted, ...conversations]);
         setSelectedConversation(formatted);
      }
      setActiveTab('chats');
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const username = conv?.otherUser?.username || '';
    return username.toLowerCase().includes((searchTerm || '').toLowerCase());
  });

  const filteredUsers = allUsers.filter(user => {
    const username = user?.username || '';
    return username.toLowerCase().includes((searchTerm || '').toLowerCase()) &&
    !conversations.some(conv => conv.otherUser?.id === user.id);
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'organizer': return 'bg-blue-100 text-blue-700';
      case 'coach': return 'bg-green-100 text-green-700';
      case 'player': return 'bg-yellow-100 text-yellow-700';
      case 'fan': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto h-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar */}
            <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-200 bg-gray-50 h-full`}>
              <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <MessageCircle className="w-7 h-7 text-indigo-600" />
                    Messages
                  </h2>
                </div>

                <div className="flex gap-2 mb-4">
                  <button onClick={() => setActiveTab('chats')} className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${activeTab === 'chats' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Chats</button>
                  <button onClick={() => setActiveTab('new')} className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${activeTab === 'new' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>New Chat</button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder={activeTab === 'chats' ? 'Search conversations...' : 'Search users...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {activeTab === 'chats' ? (
                  <>
                    {loading ? <div className="flex items-center justify-center h-full"><Loader className="w-8 h-8 text-indigo-600 animate-spin" /></div> : filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-center">No conversations yet</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv) => (
                        <div key={conv.id} onClick={() => setSelectedConversation(conv)} className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${selectedConversation?.id === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}>
                          <div className="flex items-start gap-3">
                            {conv.otherUser?.avatar_url ? <img src={conv.otherUser.avatar_url} alt="" className="w-12 h-12 rounded-full" /> : <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center"><User className="w-6 h-6 text-indigo-700" /></div>}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-gray-800 truncate">{conv.otherUser?.username || 'Unknown'}</p>
                                <span className="text-xs text-gray-500">{formatTime(conv.lastMessageTime)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                                {conv.unreadCount > 0 && <span className="ml-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">{conv.unreadCount}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} onClick={() => startNewConversation(user.id)} className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100">
                        <div className="flex items-center gap-3">
                           {user.avatar_url ? <img src={user.avatar_url} className="w-12 h-12 rounded-full" /> : <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center"><User size={20}/></div>}
                           <p className="font-bold text-gray-700">{user.username}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 h-full`}>
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedConversation(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
                      {selectedConversation.otherUser?.avatar_url ? <img src={selectedConversation.otherUser.avatar_url} alt="" className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center"><User className="w-5 h-5 text-indigo-700" /></div>}
                      <div>
                        <p className="font-semibold text-gray-800">{selectedConversation.otherUser?.username}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(selectedConversation.otherUser?.role)}`}>{selectedConversation.otherUser?.role}</span>
                      </div>
                    </div>
                    {/* Delete Conversation */}
                    <button onClick={deleteConversation} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete conversation">
                        <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                      {messages.map((msg, idx) => {
                        const isOwn = msg.sender_id === currentUser.id;
                        const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
                        const isFirst = idx === 0;

                        return (
                          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2 group relative`}>
                            {/* Avatar (Left) */}
                            {!isOwn && showAvatar && (selectedConversation.otherUser?.avatar_url ? <img src={selectedConversation.otherUser.avatar_url} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"><User className="w-4 h-4 text-gray-600" /></div>)}
                            {!isOwn && !showAvatar && <div className="w-8" />}
                            
                            {/* Options Button LEFT (Others' Messages) */}
                            {!isOwn && !msg.is_unsent && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
                              <div className={`rounded-2xl px-4 py-2 relative ${isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'} ${msg.is_unsent ? 'opacity-50 italic' : ''}`}>
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                                {isOwn && !msg.is_unsent && (msg.read ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-gray-400" />)}
                              </div>
                            </div>

                            {/* Options Button RIGHT (Own Messages) */}
                            {isOwn && !msg.is_unsent && (
                                <div className="order-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Menu */}
                            {activeMessageMenu === msg.id && (
                                <div className={`absolute z-10 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[140px] animate-in fade-in zoom-in-95
                                    ${isOwn ? 'right-0' : 'left-8'}
                                    ${isFirst ? 'top-8' : 'bottom-8'} 
                                `}>
                                    <button onClick={() => { deleteMessage(msg.id, 'me'); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                        <Trash2 size={14} /> Delete for me
                                    </button>
                                    
                                    {isOwn && (
                                        <button onClick={() => { deleteMessage(msg.id, 'everyone'); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                            <CornerUpLeft size={14} /> Unsend
                                        </button>
                                    )}
                                </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black" />
                      <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${newMessage.trim() && !sending ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                        {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-semibold mb-2">Select a conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}