'use client';

import React, { memo } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle, Image, FileText, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeUrl } from '@/lib/utils/sanitize';
import type { MessagingMessage, MessageStatus, TextContent, ImageContent, DocumentContent, LocationContent } from '@/lib/messaging/types';

interface MessageBubbleProps {
  message: MessagingMessage;
}

const StatusIcon = memo(function StatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3 text-slate-400" />;
    case 'queued':
      return <Clock className="w-3 h-3 text-slate-400" />;
    case 'sent':
      return <Check className="w-3 h-3 text-slate-400" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-slate-400" />;
    case 'read':
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    case 'failed':
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    default:
      return null;
  }
});

const MessageContent = memo(function MessageContent({ message }: { message: MessagingMessage }) {
  const { content, contentType } = message;

  switch (contentType) {
    case 'text': {
      const textContent = content as TextContent;
      return (
        <p className="whitespace-pre-wrap break-words">{textContent.text}</p>
      );
    }

    case 'image': {
      const imageContent = content as ImageContent;
      return (
        <div className="space-y-1">
          {sanitizeUrl(imageContent.mediaUrl) && (
            <img
              src={sanitizeUrl(imageContent.mediaUrl)}
              alt={imageContent.caption || 'Imagem'}
              className="max-w-[240px] rounded-lg"
            />
          )}
          {imageContent.caption && (
            <p className="whitespace-pre-wrap break-words">{imageContent.caption}</p>
          )}
        </div>
      );
    }

    case 'document': {
      const docContent = content as DocumentContent;
      const safeDocUrl = sanitizeUrl(docContent.mediaUrl);
      return safeDocUrl ? (
        <a
          href={safeDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <FileText className="w-8 h-8 text-primary-500" />
          <div className="min-w-0">
            <p className="font-medium truncate">{docContent.fileName}</p>
            {docContent.fileSize && (
              <p className="text-xs opacity-70">
                {(docContent.fileSize / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        </a>
      ) : null;
    }

    case 'location': {
      const locContent = content as LocationContent;
      return (
        <a
          href={`https://maps.google.com/?q=${locContent.latitude},${locContent.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <MapPin className="w-6 h-6 text-red-500" />
          <div>
            {locContent.name && <p className="font-medium">{locContent.name}</p>}
            {locContent.address && <p className="text-xs opacity-70">{locContent.address}</p>}
          </div>
        </a>
      );
    }

    case 'audio':
      return (
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          <span>Mensagem de áudio</span>
        </div>
      );

    case 'video':
      return (
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          <span>Vídeo</span>
        </div>
      );

    case 'sticker':
      return (
        <div className="text-4xl">
          {sanitizeUrl((content as any).mediaUrl) ? (
            <img src={sanitizeUrl((content as any).mediaUrl)} alt="Sticker" className="w-24 h-24" />
          ) : (
            '🏷️'
          )}
        </div>
      );

    default:
      return <p className="italic opacity-70">[Tipo de mensagem não suportado]</p>;
  }
});

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const time = format(new Date(message.createdAt), 'HH:mm');

  return (
    <div
      className={cn(
        'flex',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2 shadow-sm',
          isOutbound
            ? 'bg-primary-500 text-white rounded-br-md'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700'
        )}
      >
        {/* Sender name (for inbound) */}
        {!isOutbound && message.senderName && (
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
            {message.senderName}
          </p>
        )}

        {/* Content */}
        <div className="text-sm">
          <MessageContent message={message} />
        </div>

        {/* Time and status */}
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1',
            isOutbound ? 'text-white/70' : 'text-slate-400'
          )}
        >
          <span className="text-[10px]">{time}</span>
          {isOutbound && <StatusIcon status={message.status} />}
        </div>

        {/* Error message */}
        {message.status === 'failed' && message.errorMessage && (
          <p className="text-xs text-red-300 mt-1">{message.errorMessage}</p>
        )}
      </div>
    </div>
  );
});
