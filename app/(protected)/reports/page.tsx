import type { Metadata } from 'next';
import ReportsPage from '@/features/reports/ReportsPage'

export const metadata: Metadata = { title: 'Relatórios | CRM Futuros Anúncios' };

export default function Reports() {
    return <ReportsPage />
}
