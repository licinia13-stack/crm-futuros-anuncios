'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MessageSquare, User, CheckCircle, MoreVertical, LinkIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { sanitizeUrl } from '@/lib/utils/sanitize';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ConversationList } from './components/ConversationList';
import { MessageThread } from './components/MessageThread';
import { MessageInput } from './components/MessageInput';
import { ContactPanel } from './components/ContactPanel';
import { ContactLinkModal } from './components/Modals/ContactLinkModal';
import { ChannelIndicator } from './components/ChannelIndicator';
import { WindowExpiryBadge } from './components/WindowExpiryBadge';
import {
  useConversation,
  useMarkConversationRead,
  useResolveConversation,
} from '@/lib/query/hooks/useConversationsQuery';
import { useRealtimeSyncMessaging } from '@/lib/realtime/useRealtimeSync';
import { queryKeys } from '@/lib/query';
import type { ConversationView } from '@/lib/messaging/types';

interface MessagingPageProps {
  initialConversationId?: string;
}

export function MessagingPage({ initialConversationId }: MessagingPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get('id');
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    initialConversationId || conversationIdParam || undefined
  );
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Subscribe to realtime updates
  useRealtimeSyncMessaging();

  // Fetch selected conversation details
  const { data: selectedConversation, isLoading: isConversationLoading } = useConversation(selectedConversationId);

  // Mutations
  const { mutate: markAsRead } = useMarkConversationRead();
  const { mutate: resolveConversation } = useResolveConversation();

  // Mark as read when opening a conversation
  useEffect(() => {
    if (selectedConversationId && selectedConversation && selectedConversation.unreadCount > 0) {
      markAsRead(selectedConversationId);
    }
  }, [selectedConversationId, selectedConversation, markAsRead]);

  // Update URL when conversation changes
  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversationId(id);
    router.push(`/messaging?id=${id}`, { scroll: false });
  }, [router]);

  // Link conversation to contact
  const handleLinkContact = useCallback(async (contactId: string) => {
    if (!selectedConversationId) return;

    const { error } = await supabase
      .from('messaging_conversations')
      .update({ contact_id: contactId })
      .eq('id', selectedConversationId);

    if (error) throw error;

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({
      queryKey: queryKeys.messagingConversations.all,
    });
  }, [selectedConversationId, queryClient]);

  // Create contact and link
  const handleCreateContact = useCallback(async (params: { name: string; phone?: string }) => {
    if (!profile?.organization_id) throw new Error('Organization not found');

    const { data: contact, error: createError } = await supabase
      .from('contacts')
      .insert({
        name: params.name,
        phone: params.phone,
        organization_id: profile.organization_id,
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return contact.id;
  }, [profile?.organization_id]);

  // View contact in CRM
  const handleViewContact = useCallback((contactId: string) => {
    router.push(`/contacts?id=${contactId}`);
  }, [router]);

  // View deals for contact
  const handleViewDeals = useCallback((contactId: string) => {
    router.push(`/boards?contact=${contactId}`);
  }, [router]);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversation List */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="h-16 px-4 flex items-center gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
              <div className="relative">
                {sanitizeUrl(selectedConversation.externalContactAvatar) ? (
                  <img
                    src={sanitizeUrl(selectedConversation.externalContactAvatar)}
                    alt={selectedConversation.externalContactName || 'Contato'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <ChannelIndicator type={selectedConversation.channelType} size="sm" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 dark:text-white truncate">
                  {selectedConversation.contactName || selectedConversation.externalContactName || 'Contato desconhecido'}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedConversation.channelName}
                  </p>
                  <WindowExpiryBadge
                    windowExpiresAt={selectedConversation.windowExpiresAt}
                    variant="inline"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => resolveConversation(selectedConversation.id)}
                    className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                    title="Marcar como resolvida"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
                {!selectedConversation.contactId && (
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors"
                    title="Vincular contato"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <MessageThread conversationId={selectedConversation.id} />

            {/* Input */}
            <MessageInput conversation={selectedConversation} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Selecione uma conversa</p>
            <p className="text-sm">Escolha uma conversa da lista para visualizar</p>
          </div>
        )}
      </div>

      {/* Contact Panel */}
      <div className="w-80 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex-shrink-0">
        <ContactPanel
          conversation={selectedConversation}
          isLoading={isConversationLoading && !!selectedConversationId}
          onLinkContact={() => setIsLinkModalOpen(true)}
          onViewContact={handleViewContact}
          onViewDeals={handleViewDeals}
        />
      </div>

      {/* Contact Link Modal */}
      <ContactLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLinkContact={handleLinkContact}
        onCreateContact={handleCreateContact}
        currentContactId={selectedConversation?.contactId}
        suggestedPhone={selectedConversation?.contactPhone || undefined}
        suggestedName={selectedConversation?.externalContactName || undefined}
      />
    </div>
  );
}
