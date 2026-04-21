import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: 'Configurações | CRM Futuros Anúncios' };

export default function Settings() {
    return <SettingsPage />
}
