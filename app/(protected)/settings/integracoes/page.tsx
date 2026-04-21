import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: 'Integrações | CRM Futuros Anúncios' };

export default function SettingsIntegracoes() {
  return <SettingsPage tab="integrations" />
}
