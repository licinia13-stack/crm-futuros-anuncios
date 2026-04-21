import React, { useState } from 'react';
import { useCreateDealWithContact } from '@/lib/query/hooks/useDealsQuery';
import { useBoards } from '@/lib/query/hooks/useBoardsQuery';
import { useAuth } from '@/context/AuthContext';
import { Deal, Board, Contact, Company } from '@/types';
import { X, Building2, User, Mail, Phone, AlertCircle, Loader2, MapPin, Link, ChevronDown, ChevronUp } from 'lucide-react';
import { DebugFillButton } from '@/components/debug/DebugFillButton';
import { fakeDeal, fakeContact, fakeCompany } from '@/lib/debug';
import { ContactSearchCombobox } from '@/components/ui/ContactSearchCombobox';

interface CreateDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** O board ativo - passado pelo controller do Kanban */
    activeBoard?: Board | null;
    /** O ID do board ativo - passado pelo controller do Kanban */
    activeBoardId?: string;
}

/**
 * Modal para criação de um novo negócio (Deal).
 * Permite buscar contatos existentes ou criar novos.
 */
export const CreateDealModal: React.FC<CreateDealModalProps> = ({
    isOpen,
    onClose,
    activeBoard: propActiveBoard,
    activeBoardId: propActiveBoardId
}) => {
    const createDealWithContact = useCreateDealWithContact();
    const { data: boards = [] } = useBoards();
    const { profile, user } = useAuth();

    // Prioriza props sobre contexto (permite que o Kanban passe o board correto)
    const activeBoard = propActiveBoard || boards[0] || null;
    const activeBoardId = propActiveBoardId || activeBoard?.id || '';

    // Estado para contato/empresa selecionados
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    
    // Estado para criação de novo contato
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newContactData, setNewContactData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: ''
    });

    // Estado do deal
    const [dealData, setDealData] = useState({
        title: '',
        value: ''
    });

    // Estado dos dados da empresa
    const [showCompanyFields, setShowCompanyFields] = useState(true);
    const [companyData, setCompanyData] = useState({
        address: '', address2: '', address3: '',
        phone2: '', email2: '',
        website: '', facebook: '', instagram: '',
        linkedin: '', tiktok: '', googleMaps: '',
        googleMyBusiness: '', youtube: '', nif: ''
    });

    // Estado de UI
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setSelectedContact(null);
        setSelectedCompany(null);
        setIsCreatingNew(false);
        setNewContactData({ name: '', email: '', phone: '', companyName: '' });
        setDealData({ title: '', value: '' });
        setCompanyData({ address: '', address2: '', address3: '', phone2: '', email2: '', website: '', facebook: '', instagram: '', linkedin: '', tiktok: '', googleMaps: '', googleMyBusiness: '', youtube: '', nif: '' });
        setShowCompanyFields(true);
        setError(null);
        setIsSubmitting(false);
    };

    const fillWithFakeData = () => {
        const deal = fakeDeal();
        const contact = fakeContact();
        const company = fakeCompany();
        
        setDealData({
            title: deal.title,
            value: String(deal.value)
        });
        
        setIsCreatingNew(true);
        setNewContactData({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            companyName: company.name
        });
    };

    const handleCreateNew = (searchTerm: string) => {
        setIsCreatingNew(true);
        // Se o termo parece ser email, telefone ou nome
        if (searchTerm.includes('@')) {
            setNewContactData(prev => ({ ...prev, email: searchTerm }));
        } else if (/^\d+$/.test(searchTerm.replace(/\D/g, '')) && searchTerm.length >= 8) {
            setNewContactData(prev => ({ ...prev, phone: searchTerm }));
        } else {
            setNewContactData(prev => ({ ...prev, name: searchTerm }));
        }
    };

    if (!isOpen) return null;

    // Guard: não permite criar deal sem board ativo
    if (!activeBoard || !activeBoard.stages?.length) {
        return (
            <div className="fixed inset-0 md:left-[var(--app-sidebar-width,0px)] z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-5">
                    <p className="text-slate-700 dark:text-slate-300 text-center">
                        Nenhum board selecionado ou board sem estágios.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full mt-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold py-2.5 rounded-lg transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Usa o primeiro estágio do board ativo
            const firstStage = activeBoard.stages[0];

            const ownerName = profile?.nickname ||
                profile?.first_name ||
                (profile?.email || user?.email || '').split('@')[0] ||
                'Eu';

            const deal: Deal = {
                id: crypto.randomUUID(),
                title: dealData.title,
                companyId: selectedCompany?.id || '',
                contactId: selectedContact?.id || '',
                boardId: activeBoardId || activeBoard.id,
                ownerId: user?.id || '',
                value: Number(dealData.value) || 0,
                items: [],
                status: firstStage.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                probability: 10,
                priority: 'medium',
                tags: ['Novo'],
                owner: {
                    name: ownerName,
                    avatar: profile?.avatar_url || ''
                },
                customFields: {},
                isWon: false,
                isLost: false,
            };

            const { id: _id, createdAt: _createdAt, ...dealWithoutId } = deal;

            const extraCompanyFields = showCompanyFields ? {
                address:            companyData.address || undefined,
                address2:           companyData.address2 || undefined,
                address3:           companyData.address3 || undefined,
                email2:             companyData.email2 || undefined,
                website:            companyData.website || undefined,
                nif:                companyData.nif || undefined,
                facebook:           companyData.facebook || undefined,
                instagram:          companyData.instagram || undefined,
                linkedin:           companyData.linkedin || undefined,
                tiktok:             companyData.tiktok || undefined,
                google_maps:        companyData.googleMaps || undefined,
                google_my_business: companyData.googleMyBusiness || undefined,
                youtube:            companyData.youtube || undefined,
            } : {};

            // Se selecionou contato existente
            if (selectedContact) {
                await createDealWithContact.mutateAsync({
                    deal: dealWithoutId,
                    relatedData: {
                        companyName: selectedCompany?.name || '',
                        contact: {
                            name: selectedContact.name,
                            email: selectedContact.email,
                            phone: selectedContact.phone
                        },
                        extraCompanyFields,
                    }
                });
            } else {
                // Criando novo contato
                await createDealWithContact.mutateAsync({
                    deal: dealWithoutId,
                    relatedData: {
                        companyName: newContactData.companyName,
                        contact: {
                            name: newContactData.name,
                            email: newContactData.email,
                            phone: newContactData.phone
                        },
                        extraCompanyFields,
                    }
                });
            }

            onClose();
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar negócio. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasContact = selectedContact || (isCreatingNew && newContactData.name);

    return (
        <div
            className="fixed inset-0 md:left-[var(--app-sidebar-width,0px)] z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white dark:bg-dark-card z-10">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">Novo Negócio</h2>
                        <DebugFillButton onClick={fillWithFakeData} />
                    </div>
                    <button onClick={() => { onClose(); resetForm(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleCreateDeal} className="p-5 space-y-5">
                    {/* Contato - Tabs para escolher modo */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                                Contato
                            </label>
                            {!selectedContact && (
                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingNew(false)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                            !isCreatingNew 
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        Buscar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingNew(true)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                            isCreatingNew 
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        + Novo
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Modo: Contato Selecionado */}
                        {selectedContact ? (
                            <div className="relative">
                                <div className="flex items-center gap-3 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                                    <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-primary-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-white truncate">
                                            {selectedContact.name}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            {selectedContact.email && (
                                                <span className="flex items-center gap-1 truncate">
                                                    <Mail size={12} />
                                                    {selectedContact.email}
                                                </span>
                                            )}
                                            {selectedContact.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {selectedContact.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedContact(null);
                                            setSelectedCompany(null);
                                        }}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                {selectedCompany && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm">
                                        <Building2 size={14} className="text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300">{selectedCompany.name}</span>
                                    </div>
                                )}
                            </div>
                        ) : !isCreatingNew ? (
                            /* Modo: Buscar Existente */
                            <ContactSearchCombobox
                                selectedContact={selectedContact}
                                selectedCompany={selectedCompany}
                                onSelectContact={setSelectedContact}
                                onSelectCompany={setSelectedCompany}
                                onCreateNew={handleCreateNew}
                            />
                        ) : (
                            /* Modo: Criar Novo */
                            <div className="space-y-3 p-4 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Nome do contato *"
                                        required={isCreatingNew}
                                        value={newContactData.name}
                                        onChange={(e) => setNewContactData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={newContactData.email}
                                            onChange={(e) => setNewContactData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            placeholder="Telefone"
                                            value={newContactData.phone}
                                            onChange={(e) => setNewContactData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Empresa"
                                        value={newContactData.companyName}
                                        onChange={(e) => setNewContactData(prev => ({ ...prev, companyName: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dados da Empresa */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={() => setShowCompanyFields(v => !v)}
                            className="flex items-center justify-between w-full text-xs font-bold text-slate-400 uppercase mb-3 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <span className="flex items-center gap-2"><Building2 size={13} /> Dados da Empresa</span>
                            {showCompanyFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {showCompanyFields && (
                            <div className="space-y-2 mb-4">
                                {/* Moradas */}
                                {(['address', 'address2', 'address3'] as const).map((field, i) => (
                                    <div key={field} className="relative">
                                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder={i === 0 ? 'Morada 1 (principal)' : `Morada ${i + 1}`}
                                            value={companyData[field]}
                                            onChange={e => setCompanyData(prev => ({ ...prev, [field]: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                ))}

                                {/* Email 2 e Telefone 2 */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="email" placeholder="Email 2" value={companyData.email2}
                                            onChange={e => setCompanyData(prev => ({ ...prev, email2: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="tel" placeholder="Telefone 2" value={companyData.phone2}
                                            onChange={e => setCompanyData(prev => ({ ...prev, phone2: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                </div>

                                {/* Website e NIF */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="url" placeholder="Website" value={companyData.website}
                                            onChange={e => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                    <input type="text" placeholder="NIF" value={companyData.nif}
                                        onChange={e => setCompanyData(prev => ({ ...prev, nif: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>

                                {/* Redes Sociais */}
                                <p className="text-xs text-slate-400 uppercase font-bold pt-1">Redes Sociais</p>
                                {([
                                    { key: 'facebook',         label: 'Facebook',           color: 'text-blue-500' },
                                    { key: 'instagram',        label: 'Instagram',          color: 'text-pink-500' },
                                    { key: 'linkedin',         label: 'LinkedIn',           color: 'text-blue-700' },
                                    { key: 'tiktok',           label: 'TikTok',             color: 'text-slate-900 dark:text-white' },
                                    { key: 'youtube',          label: 'YouTube',            color: 'text-red-500' },
                                    { key: 'googleMaps',       label: 'Google Maps',        color: 'text-green-600' },
                                    { key: 'googleMyBusiness', label: 'Google My Business', color: 'text-yellow-500' },
                                ] as { key: keyof typeof companyData; label: string; color: string }[]).map(({ key, label, color }) => (
                                    <div key={key} className="relative">
                                        <Link size={14} className={'absolute left-3 top-1/2 -translate-y-1/2 ' + color} />
                                        <input
                                            type="url"
                                            placeholder={label + ' (URL)'}
                                            value={companyData[key]}
                                            onChange={e => setCompanyData(prev => ({ ...prev, [key]: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dados do Negócio */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Dados do Negócio</h3>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Negócio *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ex: Contrato Anual - Acme"
                                    value={dealData.title}
                                    onChange={e => setDealData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Valor Estimado (€)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="0.00"
                                    value={dealData.value}
                                    onChange={e => setDealData(prev => ({ ...prev, value: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mensagem de erro */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={!hasContact || !dealData.title || isSubmitting}
                        className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg mt-2 shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Criando...
                            </>
                        ) : (
                            'Criar Negócio'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
