'use client';

import React, { useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useMessages } from '@/lib/query/hooks/useMessagesQuery';
import type { MessagingMessage } from '@/lib/messaging/types';

interface MessageThreadProps {
  conversationId: string;
}

function DateDivider({ date }: { date: Date }) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (isSameDay(date, today)) {
    label = 'Hoje';
  } else if (isSameDay(date, yesterday)) {
    label = 'Ontem';
  } else {
    label = format(date, "d 'de' MMMM", { locale: ptBR });
  }

  return (
    <div className="flex items-center justify-center my-4">
      <span className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full">
        {label}
      </span>
    </div>
  );
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const { data: messages, isLoading, error } = useMessages(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > prevMessagesLengthRef.current) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: prevMessagesLengthRef.current === 0 ? 'auto' : 'smooth',
      });
    }
    prevMessagesLengthRef.current = messages?.length || 0;
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Carregando mensagens...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500">Erro ao carregar mensagens</div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
        <p>Nenhuma mensagem ainda</p>
        <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
      </div>
    );
  }

  // Group messages by date
  const messagesWithDates: Array<{ type: 'date'; date: Date } | { type: 'message'; message: MessagingMessage }> = [];
  let lastDate: string | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt);
    const dateKey = format(messageDate, 'yyyy-MM-dd');

    if (dateKey !== lastDate) {
      messagesWithDates.push({ type: 'date', date: messageDate });
      lastDate = dateKey;
    }
    messagesWithDates.push({ type: 'message', message });
  });

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-900/50"
    >
      {messagesWithDates.map((item, index) => {
        if (item.type === 'date') {
          return <DateDivider key={`date-${index}`} date={item.date} />;
        }
        return <MessageBubble key={item.message.id} message={item.message} />;
      })}
    </div>
  );
}
