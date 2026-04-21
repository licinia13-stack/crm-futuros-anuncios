import type { Metadata } from 'next';
import { DecisionQueuePage } from '@/features/decisions/DecisionQueuePage'

export const metadata: Metadata = { title: 'Decisões | CRM Futuros Anúncios' };

export default function Decisions() {
    return <DecisionQueuePage />
}
