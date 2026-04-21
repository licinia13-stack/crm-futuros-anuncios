import type { Metadata } from 'next';
import { MessagingPage } from '@/features/messaging/MessagingPage'

export const metadata: Metadata = { title: 'Mensagens | CRM Futuros Anúncios' };

export default function Messaging() {
    return <MessagingPage />
}
