import type { Metadata } from 'next';
import { BoardsPage } from '@/features/boards/BoardsPage'

export const metadata: Metadata = { title: 'Funis | CRM Futuros Anúncios' };

export default function Boards() {
    return <BoardsPage />
}
