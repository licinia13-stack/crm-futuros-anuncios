'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSendTextMessage } from '@/lib/query/hooks/useMessagingMessagesQuery';
import type { ConversationView } from '@/lib/messaging/types';

interface MessageInputProps {
  conversation: ConversationView;
}

export function MessageInput({ conversation }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: sendMessage, isPending } = useSendTextMessage();

  const isDisabled = conversation.isWindowExpired || isPending;

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText || isDisabled) return;

    sendMessage(
      { conversationId: conversation.id, text: trimmedText },
      {
        onSuccess: () => {
          setText('');
          textareaRef.current?.focus();
        },
      }
    );
  }, [text, isDisabled, sendMessage, conversation.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setText(textarea.value);
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
  }, []);

  if (conversation.isWindowExpired) {
    return (
      <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <Clock className="w-5 h-5" />
          <div>
            <p className="font-medium">Janela de resposta expirada</p>
            <p className="text-sm opacity-80">
              Use um template aprovado para reabrir a conversa
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          Enviar template
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
    >
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          title="Anexar arquivo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            disabled={isDisabled}
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 text-sm resize-none',
              'bg-slate-100 dark:bg-white/5 border border-transparent rounded-2xl',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'text-slate-900 dark:text-white placeholder-slate-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'max-h-[120px]'
            )}
            style={{ height: 'auto', minHeight: '40px' }}
          />
        </div>

        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="submit"
          disabled={!text.trim() || isDisabled}
          className={cn(
            'p-2.5 rounded-full transition-colors',
            text.trim() && !isDisabled
              ? 'bg-primary-500 hover:bg-primary-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
