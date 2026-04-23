'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Phone,
  Mail,
  Plus,
  X,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useConnectedChannelsQuery } from '@/lib/query/hooks/useChannelsQuery';
import { ChannelIndicator } from '../ChannelIndicator';
import type { MessagingChannel, ChannelType } from '@/lib/messaging/types';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (params: {
    channelId: string;
    identifier: string;
    contactName?: string;
    contactId?: string;
    subject?: string;
  }) => Promise<void>;
  defaultContactId?: string;
  defaultContactName?: string;
  defaultContactIdentifier?: string;
}

type Step = 'channel' | 'recipient' | 'confirm';

export function NewConversationModal({
  isOpen,
  onClose,
  onCreateConversation,
  defaultContactId,
  defaultContactName,
  defaultContactIdentifier,
}: NewConversationModalProps) {
  const { data: channels = [], isLoading: isLoadingChannels } = useConnectedChannelsQuery();

  const [step, setStep] = useState<Step>('channel');
  const [selectedChannel, setSelectedChannel] = useState<MessagingChannel | null>(null);
  const [identifier, setIdentifier] = useState(defaultContactIdentifier || '');
  const [contactName, setContactName] = useState(defaultContactName || '');
  const [subject, setSubject] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('channel');
      setSelectedChannel(null);
      setIdentifier(defaultContactIdentifier || '');
      setContactName(defaultContactName || '');
      setSubject('');
      setIsCreating(false);
      setError(null);
    }
  }, [isOpen, defaultContactIdentifier, defaultContactName]);

  const handleClose = useCallback(() => {
    setStep('channel');
    setSelectedChannel(null);
    setIdentifier(defaultContactIdentifier || '');
    setContactName(defaultContactName || '');
    setSubject('');
    setError(null);
    onClose();
  }, [onClose, defaultContactIdentifier, defaultContactName]);

  const isEmail = selectedChannel?.channelType === 'email';

  const initiableChannels = useMemo(
    () => channels.filter((c) => ['whatsapp', 'sms', 'email'].includes(c.channelType)),
    [channels]
  );

  const handleSelectChannel = (channel: MessagingChannel) => {
    setSelectedChannel(channel);
    setStep('recipient');
    setError(null);
  };

  const handleBack = () => {
    if (step === 'recipient') setStep('channel');
    else if (step === 'confirm') setStep('recipient');
    setError(null);
  };

  const handleContinue = () => {
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        setError('Endereço de email inválido');
        return;
      }
    } else {
      const cleanPhone = identifier.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Número de telefone inválido');
        return;
      }
    }
    setStep('confirm');
    setError(null);
  };

  const handleCreate = async () => {
    if (!selectedChannel) return;

    setIsCreating(true);
    setError(null);

    try {
      const cleanIdentifier = isEmail ? identifier.trim() : identifier.replace(/\D/g, '');
      await onCreateConversation({
        channelId: selectedChannel.id,
        identifier: cleanIdentifier,
        contactName: contactName || undefined,
        contactId: defaultContactId,
        subject: isEmail && subject ? subject : undefined,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conversa');
    } finally {
      setIsCreating(false);
    }
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length <= 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  };

  const displayIdentifier = isEmail ? identifier : formatPhone(identifier);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo Email" size="md">
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className={cn(step === 'channel' && 'text-primary-600 font-medium')}>1. Canal</span>
          <ChevronRight className="w-3 h-3" />
          <span className={cn(step === 'recipient' && 'text-primary-600 font-medium')}>2. Destinatário</span>
          <ChevronRight className="w-3 h-3" />
          <span className={cn(step === 'confirm' && 'text-primary-600 font-medium')}>3. Confirmar</span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Select channel */}
        {step === 'channel' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Selecione um canal:</p>
            {isLoadingChannels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : initiableChannels.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum canal conectado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {initiableChannels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleSelectChannel(channel)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                      'border-slate-200 dark:border-white/10',
                      'hover:bg-slate-50 dark:hover:bg-white/5',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500'
                    )}
                  >
                    <ChannelIndicator type={channel.channelType as ChannelType} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{channel.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{channel.externalIdentifier}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Enter recipient */}
        {step === 'recipient' && selectedChannel && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-black/20">
              <ChannelIndicator type={selectedChannel.channelType as ChannelType} size="sm" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{selectedChannel.name}</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isEmail ? 'Email do destinatário' : 'Número de telefone'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {isEmail
                    ? <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    : <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  }
                  <input
                    type={isEmail ? 'email' : 'tel'}
                    value={isEmail ? identifier : formatPhone(identifier)}
                    onChange={(e) => setIdentifier(isEmail ? e.target.value : e.target.value.replace(/\D/g, ''))}
                    placeholder={isEmail ? 'cliente@empresa.com' : '(11) 99999-9999'}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border',
                      'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10',
                      'text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'
                    )}
                    autoFocus
                  />
                </div>
              </div>

              {isEmail && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Assunto <span className="text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Assunto do email"
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg border',
                      'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10',
                      'text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'
                    )}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome do contato <span className="text-slate-400">(opcional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="João Silva"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border',
                      'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10',
                      'text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500'
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedChannel && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                {isEmail ? 'Confirmar novo email' : 'Confirmar nova conversa'}
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Canal:</dt>
                  <dd className="text-slate-900 dark:text-white font-medium flex items-center gap-1.5">
                    <ChannelIndicator type={selectedChannel.channelType as ChannelType} size="sm" />
                    {selectedChannel.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{isEmail ? 'Para:' : 'Telefone:'}</dt>
                  <dd className="text-slate-900 dark:text-white font-medium">{displayIdentifier}</dd>
                </div>
                {isEmail && subject && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">Assunto:</dt>
                    <dd className="text-slate-900 dark:text-white font-medium truncate max-w-[180px]">{subject}</dd>
                  </div>
                )}
                {contactName && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">Nome:</dt>
                    <dd className="text-slate-900 dark:text-white font-medium">{contactName}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={step === 'channel' ? handleClose : handleBack}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            {step === 'channel' ? 'Cancelar' : 'Voltar'}
          </button>

          {step === 'recipient' && (
            <button
              type="button"
              onClick={handleContinue}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold',
                'bg-primary-600 text-white hover:bg-primary-700',
                'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              )}
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 'confirm' && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold',
                'bg-primary-600 text-white hover:bg-primary-700',
                'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              )}
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />A criar...</>
              ) : (
                <><Plus className="w-4 h-4" />{isEmail ? 'Criar conversa' : 'Iniciar Conversa'}</>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default NewConversationModal;
