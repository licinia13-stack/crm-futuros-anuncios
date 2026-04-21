import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: 'Produtos | CRM Futuros Anúncios' };

export default function SettingsProducts() {
  return <SettingsPage tab="products" />
}
