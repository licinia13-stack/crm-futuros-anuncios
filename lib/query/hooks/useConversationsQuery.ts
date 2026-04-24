'use client';

/**
 * TanStack Query hooks for Messaging Conversations
 *
 * Features:
 * - Fetch conversations with filters
 * - Optimistic updates for instant UI feedback
 * - Automatic cache invalidation
 * - Realtime-ready (integrates with useRealtimeSyncMessaging)
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '../index';
import { supabase } from '@/lib/supabase';
import { sanitizePostgrestValue } from '@/lib/utils/sanitize';
import { useAuth } from '@/context/AuthContext';
import type {
  DbMessagingConversation,
  MessagingConversation,
  ConversationView,
  ConversationFilters,
  UpdateConversationInput,
} from '@/lib/messaging/types';
import {
  transformConversation as transform,
  isWindowExpired as checkWindowExpired,
  getWindowMinutesRemaining as getWindowMinutes,
} from '@/lib/messaging/types';

// =============================================================================
// PENDING DELETION GUARD
// =============================================================================

/**
 * Module-level set of conversation IDs currently being deleted.
 *
 * Problem: Other mutations (e.g. markAsRead) have their own onSettled that calls
 * invalidateQueries(messagingConversations.all). If they complete while a delete
 * is in-flight, their refetch can return the conversation still in the DB
 * (the DELETE hasn't committed yet), overwriting the optimistic removal.
 *
 * Solution: addPendingDeletion() before starting the delete. The useConversations
 * `select` filter removes the ID from every query result until removePendingDeletion()
 * is called (in onSettled, after the mutation settles either way).
 */
export const pendingDeletionIds = new Set<string>();

export function addPendingDeletion(id: string): void {
  pendingDeletionIds.add(id);
}

export function removePendingDeletion(id: string): void {
  pendingDeletionIds.delete(id);
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Fetch all conversations with optional filters.
 * Returns ConversationView[] with denormalized channel and contact data.
 */
export function useConversations(filters?: ConversationFilters) {
  const { user, profile, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: queryKeys.messagingConversations.filtered(filters),
    queryFn: async (): Promise<ConversationView[]> => {
      // Build query with joins for denormalized data
      let query = supabase
        .from('messaging_conversations')
        .select(`
          *,
          channel:messaging_channels!channel_id (
            id,
            name,
            channel_type,
            provider
          ),
          contact:contacts!contact_id (
            id,
            name,
            email,
            phone,
            ai_paused
          ),
          assigned_user:profiles!assigned_user_id (
            id,
            name,
            avatar_url
          )
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      // Defense-in-depth: filter by organization even though RLS handles it
      if (profile?.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.channelId) {
        query = query.eq('channel_id', filters.channelId);
      } else if (filters?.channelType) {
        // Filter by channel type via a subquery on channel IDs — applied in SQL so
        // keepPreviousData never leaks conversations from other channels.
        const { data: channelIds } = await supabase
          .from('messaging_channels')
          .select('id')
          .eq('channel_type', filters.channelType);
        const ids = (channelIds || []).map((c: { id: string }) => c.id);
        if (ids.length === 0) return [];
        query = query.in('channel_id', ids);
      } else if (filters?.excludeChannelType) {
        // Fetch allowed channel IDs (those NOT of the excluded type) and use .in()
        // — safer than .not('channel_id', 'in', ...) which has PostgREST formatting quirks.
        const { data: allowedChannels } = await supabase
          .from('messaging_channels')
          .select('id')
          .neq('channel_type', filters.excludeChannelType);
        const ids = (allowedChannels || []).map((c: { id: string }) => c.id);
        if (ids.length === 0) return [];
        query = query.in('channel_id', ids);
      }
      if (filters?.businessUnitId) {
        query = query.eq('business_unit_id', filters.businessUnitId);
      }
      if (filters?.assignedUserId === 'unassigned') {
        query = query.is('assigned_user_id', null);
      } else if (filters?.assignedUserId) {
        query = query.eq('assigned_user_id', filters.assignedUserId);
      }
      if (filters?.hasUnread) {
        query = query.gt('unread_count', 0);
      }
      if (filters?.search) {
        const safe = sanitizePostgrestValue(filters.search);
        if (safe) {
          query = query.or(
            `external_contact_name.ilike.%${safe}%,last_message_preview.ilike.%${safe}%`
          );
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform to ConversationView
      const result = (data || []).map((row): ConversationView => {
        const base = transform(row as DbMessagingConversation);
        const channel = row.channel as { id: string; name: string; channel_type: string; provider: string } | null;
        const contact = row.contact as { id: string; name: string; email: string; phone: string; ai_paused?: boolean } | null;
        const assignedUser = row.assigned_user as { id: string; name: string; avatar_url: string } | null;

        return {
          ...base,
          channelType: (channel?.channel_type || 'whatsapp') as ConversationView['channelType'],
          channelName: channel?.name || 'Canal',
          contactName: contact?.name,
          contactEmail: contact?.email,
          contactPhone: contact?.phone,
          contactAiPaused: contact?.ai_paused ?? false,
          assignedUserName: assignedUser?.name,
          assignedUserAvatar: assignedUser?.avatar_url,
          isWindowExpired: checkWindowExpired(base, channel?.provider),
          windowMinutesRemaining: getWindowMinutes(base),
        };
      });

      if (filters?.channelType) {
        return result.filter((conv) => conv.channelType === filters.channelType);
      }
      if (filters?.excludeChannelType) {
        return result.filter((conv) => conv.channelType !== filters.excludeChannelType);
      }
      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: !authLoading && !!user && !!profile?.organization_id,
    // Filter out conversations being deleted so stale refetches from other
    // mutations (e.g. markAsRead.onSettled) can't re-add them while the
    // delete mutation is in-flight.
    select: (data) =>
      pendingDeletionIds.size === 0
        ? data
        : data.filter((conv) => !pendingDeletionIds.has(conv.id)),
  });
}

/**
 * Fetch a single conversation by ID.
 */
export function useConversation(conversationId: string | undefined) {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: queryKeys.messagingConversations.detail(conversationId || ''),
    queryFn: async (): Promise<ConversationView | null> => {
      const { data, error } = await supabase
        .from('messaging_conversations')
        .select(`
          *,
          channel:messaging_channels!channel_id (
            id,
            name,
            channel_type,
            provider
          ),
          contact:contacts!contact_id (
            id,
            name,
            email,
            phone,
            ai_paused
          ),
          assigned_user:profiles!assigned_user_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('id', conversationId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const base = transform(data as DbMessagingConversation);
      const channel = data.channel as { id: string; name: string; channel_type: string; provider: string } | null;
      const contact = data.contact as { id: string; name: string; email: string; phone: string; ai_paused?: boolean } | null;
      const assignedUser = data.assigned_user as { id: string; name: string; avatar_url: string } | null;

      return {
        ...base,
        channelType: (channel?.channel_type || 'whatsapp') as ConversationView['channelType'],
        channelName: channel?.name || 'Canal',
        contactName: contact?.name,
        contactEmail: contact?.email,
        contactPhone: contact?.phone,
        contactAiPaused: contact?.ai_paused ?? false,
        assignedUserName: assignedUser?.name,
        assignedUserAvatar: assignedUser?.avatar_url,
        isWindowExpired: checkWindowExpired(base, channel?.provider),
        windowMinutesRemaining: getWindowMinutes(base),
      };
    },
    staleTime: 30 * 1000,
    enabled: !authLoading && !!user && !!conversationId,
  });
}

/**
 * Fetch unread conversations count, optionally scoped to a channel type.
 * Pass channelType='email' for email badge, or excludeChannelType='email' for messaging badge.
 */
export function useUnreadCount(options?: { channelType?: string; excludeChannelType?: string }) {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.messagingConversations.unreadCount(), options ?? null],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('messaging_conversations')
        .select('channel:messaging_channels!channel_id(channel_type)', { count: 'exact' })
        .gt('unread_count', 0)
        .eq('status', 'open');

      if (error) throw error;

      const rows = (data || []) as unknown as { channel: { channel_type: string } | null }[];

      if (options?.channelType) {
        return rows.filter(r => r.channel?.channel_type === options.channelType).length;
      }
      if (options?.excludeChannelType) {
        return rows.filter(r => r.channel?.channel_type !== options.excludeChannelType).length;
      }
      return rows.length;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !authLoading && !!user,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Update a conversation (status, priority, assignment).
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      updates,
    }: {
      conversationId: string;
      updates: UpdateConversationInput;
    }) => {
      // Transform to snake_case for DB
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.assignedUserId !== undefined) {
        dbUpdates.assigned_user_id = updates.assignedUserId;
        dbUpdates.assigned_at = updates.assignedUserId ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from('messaging_conversations')
        .update(dbUpdates)
        .eq('id', conversationId);

      if (error) throw error;
      return { conversationId, updates };
    },
    onMutate: async ({ conversationId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.messagingConversations.all,
      });

      // Snapshot previous value
      const previousConversations = queryClient.getQueriesData({
        queryKey: queryKeys.messagingConversations.all,
      });

      // Optimistically update list caches.
      // Guard against non-array entries (e.g. detail queries return ConversationView | null).
      queryClient.setQueriesData(
        { queryKey: queryKeys.messagingConversations.all },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return (old as ConversationView[]).map((conv) =>
            conv.id === conversationId ? { ...conv, ...updates } : conv
          );
        }
      );

      // Also optimistically update the detail query so the header dropdown
      // reflects the change immediately without waiting for the refetch.
      queryClient.setQueryData(
        queryKeys.messagingConversations.detail(conversationId),
        (old: ConversationView | null | undefined) => {
          if (!old) return old;
          return { ...old, ...updates };
        }
      );

      return { previousConversations };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        for (const [queryKey, data] of context.previousConversations) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messagingConversations.all,
      });
    },
  });
}

/**
 * Mark conversation as read (reset unread count).
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/messaging/conversations/${conversationId}/read`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to mark as read');
      }
      return conversationId;
    },
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.messagingConversations.all,
      });

      // Optimistically set unread to 0
      queryClient.setQueriesData(
        { queryKey: queryKeys.messagingConversations.all },
        (old: ConversationView[] | undefined) => {
          if (!old) return old;
          return old.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          );
        }
      );
    },
    onSettled: () => {
      // Skip conversations-list invalidation while a delete is in-progress.
      // The delete mutation handles cache cleanup directly, and invalidating here
      // triggers a refetch that can return the conversation from DB before it's
      // fully deleted, causing it to flash back into the list.
      if (pendingDeletionIds.size === 0) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messagingConversations.all,
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.messagingConversations.unreadCount(),
      });
    },
  });
}

/**
 * Resolve (close) a conversation.
 */
export function useResolveConversation() {
  const updateMutation = useUpdateConversation();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      return updateMutation.mutateAsync({
        conversationId,
        updates: { status: 'resolved' },
      });
    },
  });
}

/**
 * Reopen a conversation.
 */
export function useReopenConversation() {
  const updateMutation = useUpdateConversation();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      return updateMutation.mutateAsync({
        conversationId,
        updates: { status: 'open' },
      });
    },
  });
}

/**
 * Assign conversation to a user.
 */
export function useAssignConversation() {
  const updateMutation = useUpdateConversation();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string | null;
    }) => {
      return updateMutation.mutateAsync({
        conversationId,
        updates: { assignedUserId: userId },
      });
    },
  });
}

/**
 * Delete a conversation and all its messages.
 * Use with caution - this is a destructive action.
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      // Delete messages first (FK constraint)
      const { error: messagesError } = await supabase
        .from('messaging_messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) throw messagesError;

      // Then delete conversation
      const { error: conversationError } = await supabase
        .from('messaging_conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) throw conversationError;

      return conversationId;
    },
    onSuccess: (deletedId) => {
      // Cancel any in-flight refetches triggered by realtime during the mutation.
      // The messaging_messages DELETE event fires before the conversation is deleted,
      // causing a refetch that returns the conversation still in the list and overwrites
      // the optimistic removal. Cancelling here prevents that race condition.
      queryClient.cancelQueries({ queryKey: queryKeys.messagingConversations.all });

      // Remove detail query so onSettled invalidateQueries doesn't refetch it
      queryClient.removeQueries({
        queryKey: queryKeys.messagingConversations.detail(deletedId),
      });
      // Remove from list caches — guard against non-array entries (e.g. detail queries)
      queryClient.setQueriesData(
        { queryKey: queryKeys.messagingConversations.all },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return (old as ConversationView[]).filter((conv) => conv.id !== deletedId);
        }
      );
    },
    onSettled: () => {
      // NOTE: removePendingDeletion is intentionally NOT called here.
      // The guard must stay up until the messaging_conversations DELETE realtime event
      // arrives (in useRealtimeSync). The DB trigger that runs on messages DELETE fires a
      // conversations UPDATE event that arrives via WebSocket AFTER this HTTP onSettled —
      // if we lower the guard here, that UPDATE queues a refetch that re-shows the deleted
      // conversation before the DELETE realtime event cleans it up.
      //
      // NOTE: invalidateQueries(messagingConversations.all) is intentionally omitted.
      // onSuccess already removed the conversation from cache; an extra invalidation here
      // races with the still-pending DB trigger and can re-fetch a stale row.
      queryClient.invalidateQueries({
        queryKey: queryKeys.messagingConversations.unreadCount(),
      });
    },
  });
}
