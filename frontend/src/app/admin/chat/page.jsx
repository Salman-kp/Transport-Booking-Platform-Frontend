"use client";

import { MessageSquare, Search, Phone, Video, MoreVertical, Send } from 'lucide-react';

export default function ChatManagement() {
  const activeChats = [
    { id: 1, name: 'Alice Johnson', status: 'online', lastMessage: 'Can you help me with my booking?', time: '10:30 AM', unread: 2 },
    { id: 2, name: 'Bob Smith', status: 'offline', lastMessage: 'Thank you!', time: 'Yesterday', unread: 0 },
    { id: 3, name: 'Charlie Brown', status: 'online', lastMessage: 'I need to cancel my ticket.', time: '09:15 AM', unread: 1 },
  ];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Chat</h1>
        <p className="text-slate-500 mt-1">Manage active user support requests.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-1 overflow-hidden">
        
        {/* Sidebar - Chat List */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeChats.map((chat, idx) => (
              <div 
                key={chat.id} 
                className={`p-4 flex items-center gap-4 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${
                  idx === 0 ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                    {chat.name.charAt(0)}
                  </div>
                  {chat.status === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{chat.name}</h4>
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">{chat.time}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {/* Chat Header */}
          <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                A
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Alice Johnson</h3>
                <p className="text-xs text-emerald-500 font-medium">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Phone size={20} /></button>
              <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Video size={20} /></button>
              <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical size={20} /></button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            <div className="flex justify-center">
              <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">Today</span>
            </div>
            
            {/* Received Message */}
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold">
                A
              </div>
              <div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm text-slate-700 text-sm">
                  Hi, I'm having trouble booking a bus ticket from New York to Boston.
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 ml-1 block">10:28 AM</span>
              </div>
            </div>
            
            {/* Sent Message */}
            <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600 text-xs font-bold">
                TR
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm text-sm">
                  Hello Alice! I'd be happy to help you with that. Could you please specify the date you're planning to travel?
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 mr-1 block">10:29 AM</span>
              </div>
            </div>

            {/* Received Message */}
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold">
                A
              </div>
              <div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm text-slate-700 text-sm">
                  Can you help me with my booking?
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 ml-1 block">10:30 AM</span>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              />
              <button className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors flex-shrink-0 shadow-sm">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
