import type { Metadata } from 'next';
import { ActivitiesPage } from '@/features/activities/ActivitiesPage'

export const metadata: Metadata = { title: 'Atividades | CRM Futuros Anúncios' };

export default function Activities() {
    return <ActivitiesPage />
}
