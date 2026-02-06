'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Power,
  Trash2,
  Settings2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  QrCode,
  MessageCircle,
  Instagram,
  Mail,
  Smartphone,
  Phone,
  Send,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { Modal } from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils/cn';
import {
  useChannelsQuery,
  useDeleteChannelMutation,
  useToggleChannelStatusMutation,
} from '@/lib/query/hooks/useChannelsQuery';
import {
  type MessagingChannel,
  type ChannelType,
  type ChannelStatus,
  CHANNEL_STATUS_LABELS,
  CHANNEL_TYPE_INFO,
} from '@/lib/messaging/types';
import { ChannelSetupWizard } from './ChannelSetupWizard';

// =============================================================================
// CONSTANTS
// =============================================================================

const CHANNEL_ICONS: Record<ChannelType, React.FC<{ className?: string }>> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  email: Mail,
  sms: Smartphone,
  telegram: Send,
  voice: Phone,
};

const STATUS_ICONS: Record<ChannelStatus, React.FC<{ className?: string }>> = {
  pending: Clock,
  connecting: RefreshCw,
  connected: CheckCircle,
  disconnected: WifiOff,
  error: AlertCircle,
  waiting_qr: QrCode,
};

const STATUS_COLORS: Record<ChannelStatus, string> = {
  pending: 'text-slate-500 bg-slate-100 dark:bg-slate-500/10',
  connecting: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/10',
  connected: 'text-green-600 bg-green-100 dark:bg-green-500/10',
  disconnected: 'text-slate-400 bg-slate-100 dark:bg-slate-500/10',
  error: 'text-red-600 bg-red-100 dark:bg-red-500/10',
  waiting_qr: 'text-blue-600 bg-blue-100 dark:bg-blue-500/10',
};

// =============================================================================
// WEBHOOK INFO (Meta Cloud)
// =============================================================================

/**
 * Extract the project ref (subdomain) from the Supabase URL.
 * Format: https://<project-ref>.supabase.co
 */
function getSupabaseProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  try {
    const hostname = new URL(url).hostname; // e.g. "abcdef.supabase.co"
    return hostname.split('.')[0];
  } catch {
    return '';
  }
}

function WebhookInfo({ channelId, verifyToken }: { channelId: string; verifyToken?: string }) {
  const { addToast } = useToast();
  const projectRef = getSupabaseProjectRef();
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/messaging-webhook-meta/${channelId}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} copiado!`, 'success');
    } catch {
      addToast('Erro ao copiar', 'error');
    }
  };

  return (
    <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
      <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-1.5">
        <ExternalLink className="w-3.5 h-3.5" />
        Configure o Webhook no Meta for Developers
      </h5>

      <div className="space-y-2">
        {/* Callback URL */}
        <div>
          <label className="text-[10px] font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wider">
            Callback URL
          </label>
          <div className="flex items-center gap-1 mt-0.5">
            <code className="flex-1 text-[11px] bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-900 dark:text-blue-100 truncate">
              {webhookUrl}
            </code>
            <button
              onClick={() => copyToClipboard(webhookUrl, 'URL')}
              className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded transition-colors"
              title="Copiar URL"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>

        {/* Verify Token */}
        {verifyToken && (
          <div>
            <label className="text-[10px] font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wider">
              Verify Token
            </label>
            <div className="flex items-center gap-1 mt-0.5">
              <code className="flex-1 text-[11px] bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-900 dark:text-green-100 font-mono">
                {verifyToken}
              </code>
              <button
                onClick={() => copyToClipboard(verifyToken, 'Token')}
                className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded transition-colors"
                title="Copiar Token"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-blue-600 dark:text-blue-300">
          Selecione os eventos: <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">messages</code> e <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">message_status</code>
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// CHANNEL CARD
// =============================================================================

interface ChannelCardProps {
  channel: MessagingChannel;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

function ChannelCard({
  channel,
  onEdit,
  onToggle,
  onDelete,
  isLoading,
}: ChannelCardProps) {
  const Icon = CHANNEL_ICONS[channel.channelType] || MessageSquare;
  const StatusIcon = STATUS_ICONS[channel.status];
  const typeInfo = CHANNEL_TYPE_INFO[channel.channelType];
  const isConnected = channel.status === 'connected';
  const isConnecting = channel.status === 'connecting';

  return (
    <div className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
      <div className="flex items-start justify-between gap-4">
        {/* Icon & Info */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              typeInfo?.color || 'bg-slate-500',
              'text-white'
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {channel.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {typeInfo?.label} · {channel.provider}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {channel.externalIdentifier}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            STATUS_COLORS[channel.status]
          )}
        >
          <StatusIcon
            className={cn(
              'w-3.5 h-3.5',
              isConnecting && 'animate-spin'
            )}
          />
          <span>{CHANNEL_STATUS_LABELS[channel.status]}</span>
        </div>
      </div>

      {/* Status Message */}
      {channel.statusMessage && channel.status === 'error' && (
        <div className="mt-3 p-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <p className="text-xs text-red-700 dark:text-red-300">
            {channel.statusMessage}
          </p>
        </div>
      )}

      {/* Webhook URL for Meta Cloud */}
      {channel.provider === 'meta-cloud' && channel.status === 'pending' && (
        <WebhookInfo
          channelId={channel.id}
          verifyToken={channel.credentials?.verifyToken as string | undefined}
        />
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10
              hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Configurar
          </button>
          <button
            onClick={onToggle}
            disabled={isLoading || isConnecting}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
              isConnected
                ? 'bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                : 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20'
            )}
          >
            {isConnected ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                Desconectar
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                Conectar
              </>
            )}
          </button>
        </div>

        <button
          onClick={onDelete}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-white dark:bg-white/5 border border-red-200 dark:border-red-500/20
            text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10
            transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyChannelsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
        <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
        Nenhum canal configurado
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
        Configure canais de comunicação para receber e enviar mensagens
        diretamente pelo CRM.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
          bg-primary-600 text-white hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Adicionar Canal
      </button>
    </div>
  );
}


// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChannelsSection() {
  const { profile } = useAuth();
  const { addToast } = useToast();

  // Queries
  const { data: channels = [], isLoading } = useChannelsQuery();

  // Mutations
  const deleteMutation = useDeleteChannelMutation();
  const toggleMutation = useToggleChannelStatusMutation();

  // Local state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<MessagingChannel | null>(null);
  const [channelToEdit, setChannelToEdit] = useState<MessagingChannel | null>(null);

  const canUse = profile?.role === 'admin';

  // Handlers
  const handleToggleChannel = async (channel: MessagingChannel) => {
    const isConnected = channel.status === 'connected';
    try {
      await toggleMutation.mutateAsync({
        channelId: channel.id,
        connect: !isConnected,
      });
      addToast(
        isConnected ? 'Canal desconectado.' : 'Conectando canal...',
        'success'
      );
    } catch {
      addToast('Erro ao alterar status do canal.', 'error');
    }
  };

  const handleDeleteChannel = async () => {
    if (!channelToDelete) return;
    try {
      await deleteMutation.mutateAsync(channelToDelete.id);
      addToast('Canal removido com sucesso.', 'success');
      setChannelToDelete(null);
    } catch {
      addToast('Erro ao remover canal.', 'error');
    }
  };

  if (!canUse) {
    return (
      <SettingsSection title="Canais de Mensagem" icon={MessageSquare}>
        <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-600 dark:text-slate-300">
          Disponível apenas para administradores.
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title="Canais de Mensagem" icon={MessageSquare}>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
        Configure canais de WhatsApp, Instagram e outros para centralizar suas
        conversas no CRM.
      </p>

      {/* Actions - only show when there are channels */}
      {channels.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {channels.length} canal{channels.length > 1 ? 'is' : ''} configurado{channels.length > 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold
              bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar Canal
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : channels.length === 0 ? (
        <EmptyChannelsState onAdd={() => setIsAddModalOpen(true)} />
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onEdit={() => setChannelToEdit(channel)}
              onToggle={() => handleToggleChannel(channel)}
              onDelete={() => setChannelToDelete(channel)}
              isLoading={
                toggleMutation.isPending || deleteMutation.isPending
              }
            />
          ))}
        </div>
      )}

      {/* Channel Setup Wizard */}
      <ChannelSetupWizard
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!channelToDelete}
        onClose={() => setChannelToDelete(null)}
        onConfirm={handleDeleteChannel}
        title="Remover canal?"
        message={
          <div>
            Isso vai remover o canal <b>{channelToDelete?.name}</b>. As conversas
            existentes serão mantidas, mas novas mensagens não serão recebidas.
          </div>
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Edit Modal (placeholder - will be replaced by wizard) */}
      <Modal
        isOpen={!!channelToEdit}
        onClose={() => setChannelToEdit(null)}
        title={`Configurar ${channelToEdit?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            A configuração detalhada do canal será implementada no próximo passo
            (ChannelSetupWizard).
          </p>

          {channelToEdit && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Tipo:</dt>
                  <dd className="text-slate-900 dark:text-white font-medium">
                    {CHANNEL_TYPE_INFO[channelToEdit.channelType]?.label}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Provider:</dt>
                  <dd className="text-slate-900 dark:text-white font-medium">
                    {channelToEdit.provider}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Identificador:</dt>
                  <dd className="text-slate-900 dark:text-white font-medium">
                    {channelToEdit.externalIdentifier}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Status:</dt>
                  <dd className="text-slate-900 dark:text-white font-medium">
                    {CHANNEL_STATUS_LABELS[channelToEdit.status]}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setChannelToEdit(null)}
              className="px-4 py-2 rounded-lg text-sm font-semibold
                text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10
                transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </SettingsSection>
  );
}
