# Tasks: Inbox Unificado de Messaging Omnichannel

<!-- Tech Stack Validation: PASSED -->
<!-- Validated against: .specswarm/tech-stack.md v1.0.0 -->
<!-- No prohibited technologies found -->

**Feature**: 001-unified-messaging-inbox
**Generated**: 2026-02-06
**Status**: ✅ Complete (100%)

---

## Task Legend

- `[P]` = Parallelizable (can run concurrently with other [P] tasks in same phase)
- `[US-X]` = Maps to User Scenario X from spec.md
- `[FR-X.Y]` = Maps to Functional Requirement X.Y
- `✅` = Already completed
- `🔄` = In progress
- `⏳` = Pending

---

## Progress Summary

| Phase | Description | Status | Tasks |
|-------|-------------|--------|-------|
| Phase 1 | Setup & Foundational | ✅ Complete | 0 remaining |
| Phase 2 | Core Messaging (Providers) | ✅ Complete | 0 remaining |
| Phase 3 | US1 - Admin Configura Business Unit | ✅ Complete | 0 remaining |
| Phase 4 | US2 - Vendedor Recebe/Responde | ✅ Complete | 0 remaining |
| Phase 5 | US3 - Vendedor Inicia Conversa | ✅ Complete | 0 remaining |
| Phase 6 | US4 - Filtros e Busca | ✅ Complete | 0 remaining |
| Phase 7 | US5 - Vinculação Automática | ✅ Complete | 0 remaining |
| Phase 8 | Polish & Integration | ✅ Complete | 0 remaining |

**Total Remaining: 0 tasks** ✅

---

## Phase 1: Setup & Foundational ✅ COMPLETE

> All foundational tasks have been completed.

- ✅ T001: Create messaging database migrations
- ✅ T002: Create messaging types (channel, message, provider, webhook, template)
- ✅ T003: Create ChannelProviderFactory
- ✅ T004: Create ChannelRouterService
- ✅ T005: Add messaging query keys to queryKeys.ts
- ✅ T006: Create MessagingContext

---

## Phase 2: Core Messaging Providers ✅ COMPLETE

> All provider implementations complete.

- ✅ T007: Create base.provider.ts
- ✅ T008: Create z-api.provider.ts
- ✅ T009: Create meta-cloud.provider.ts
- ✅ T010: Create messaging-webhook-zapi Edge Function
- ✅ T011: Create messaging-webhook-meta Edge Function
- ✅ T012: Add webhook deduplication (generateStableEventId)
- ✅ T013: Create RPC update_message_status_if_newer

---

## Phase 3: US1 - Admin Configura Business Unit ✅ COMPLETE

**User Scenario 3**: Admin Cria Business Unit e Configura Canal
**Goal**: Admin pode criar Business Units, vincular boards, configurar canais e adicionar membros
**Requirements**: FR-0.1 → FR-0.6, FR-1.1 → FR-1.6

### Query Layer

| ID | Task | File | Status | Parallel |
|----|------|------|--------|----------|
| T014 | Create useBusinessUnitsQuery hook | `lib/query/hooks/useBusinessUnitsQuery.ts` | ✅ | [P] |
| T015 | Create useChannelsQuery hook | `lib/query/hooks/useChannelsQuery.ts` | ✅ | [P] |

### Settings UI

| ID | Task | File | Status | Parallel |
|----|------|------|--------|----------|
| T016 | Create BusinessUnitsSection component | `features/settings/components/BusinessUnitsSection.tsx` | ✅ | |
| T017 | Create BusinessUnitForm modal | `features/settings/components/BusinessUnitForm.tsx` | ✅ | |
| T018 | Create BusinessUnitMembers component | `features/settings/components/BusinessUnitMembers.tsx` | ✅ | |
| T019 | Create ChannelsSection component | `features/settings/components/ChannelsSection.tsx` | ✅ | |
| T020 | Create ChannelSetupWizard component | `features/settings/components/ChannelSetupWizard.tsx` | ✅ | |

### Test Criteria
- [x] Admin can create a Business Unit with name and key
- [x] Admin can assign existing boards to a Business Unit
- [x] Admin can add/remove members from a Business Unit
- [x] Admin can add a WhatsApp channel via Z-API wizard
- [x] Channel shows "Conectado" after QR code scan

---

## Phase 4: US2 - Vendedor Recebe/Responde Mensagem ✅ COMPLETE

**User Scenario 1**: Vendedor Recebe Mensagem do WhatsApp
**Goal**: Vendedor visualiza conversas no inbox, abre thread, responde
**Requirements**: FR-2.1 → FR-2.5, FR-3.1 → FR-3.3, FR-4.1 → FR-4.3

### Already Complete ✅
- ✅ ConversationList, ConversationItem
- ✅ MessageThread, MessageBubble, MessageInput
- ✅ MessagingPage, useMessagingController
- ✅ ConversationListSkeleton, MessageThreadSkeleton

### UI Components ✅

| ID | Task | File | Status | Parallel |
|----|------|------|--------|----------|
| T021 | Create ChannelIndicator component | `features/messaging/components/ChannelIndicator.tsx` | ✅ | [P] |
| T022 | Create WindowExpiryBadge component | `features/messaging/components/WindowExpiryBadge.tsx` | ✅ | [P] |
| T023 | Create BusinessUnitSelector component | `features/messaging/components/BusinessUnitSelector.tsx` | ✅ | [P] |
| T024 | Create ContactPanel component | `features/messaging/components/ContactPanel.tsx` | ✅ | |
| T025 | Create ContactPanelSkeleton | `features/messaging/components/skeletons/ContactPanelSkeleton.tsx` | ✅ | [P] |

### Test Criteria
- [x] Vendedor vê lista de conversas ordenadas por última mensagem
- [x] Conversas não lidas destacadas visualmente
- [x] Badge de canal (WhatsApp verde) visível no avatar
- [x] Badge de janela 24h mostra tempo restante
- [x] Seletor de Business Unit filtra conversas
- [x] Painel lateral mostra dados do contato

---

## Phase 5: US3 - Vendedor Inicia Conversa ✅ COMPLETE

**User Scenario 2**: Vendedor Inicia Conversa com Lead
**Goal**: Vendedor pode iniciar nova conversa a partir de um contato
**Requirements**: FR-3.1, FR-5.1

| ID | Task | File | Status | Parallel |
|----|------|------|--------|----------|
| T026 | Create NewConversationModal | `features/messaging/components/Modals/NewConversationModal.tsx` | ✅ | |
| T027 | Add "Enviar Mensagem" button to DealDetailModal | `features/boards/components/Modals/DealDetailModal.tsx` | ✅ | |

### Test Criteria
- [x] Botão "Enviar Mensagem" visível no modal de deal
- [x] Modal abre com seleção de canal (WhatsApp)
- [x] Nova conversa criada e vinculada ao contato
- [x] Usuário redirecionado para inbox com conversa aberta

---

## Phase 6: US4 - Filtros e Busca ✅ COMPLETE

**User Scenario 4**: Vendedor Filtra Conversas por Status
**Goal**: Vendedor pode filtrar e buscar conversas no inbox
**Requirements**: FR-4.4, FR-4.5

| ID | Task | File | Status | Parallel |
|----|------|------|--------|----------|
| T028 | Add filter controls to ConversationList | `features/messaging/components/ConversationList.tsx` | ✅ | |
| T029 | Add search input to ConversationList | `features/messaging/components/ConversationList.tsx` | ✅ | |
| T030 | Implement conversation filtering in useMessagingController | `features/messaging/hooks/useMessagingController.ts` | ✅ | |

### Test Criteria
- [x] Filtro por "Não lidas" funciona
- [x] Filtro por canal funciona
- [x] Filtro por status (open/resolved) funciona
- [x] Busca por nome retorna resultados
- [x] Ordenação por mais recente/antiga funciona

---

## Phase 7: US5 - Vinculação Automática ✅ COMPLETE

**User Scenario 5**: Sistema Vincula Automaticamente Conversa a Contato
**Goal**: Sistema cria contato automaticamente e vincula conversa
**Requirements**: FR-5.1 → FR-5.3

### Already Complete ✅
- ✅ Contact matching by phone in webhook handlers
- ✅ Auto-create contact when not found

### Remaining

| ID | Task | File | Status | Parallel |
|----|------|------|--------|----------|
| T031 | Add "Vincular a outro contato" action | `features/messaging/components/ContactPanel.tsx` | ✅ | |
| T032 | Create ContactLinkModal | `features/messaging/components/Modals/ContactLinkModal.tsx` | ✅ | |

### Test Criteria
- [x] Nova mensagem de número conhecido vincula a contato existente
- [x] Nova mensagem de número desconhecido cria contato
- [x] Usuário pode revincular conversa a contato diferente

---

## Phase 8: Polish & Integration ✅ COMPLETE

**Goal**: Finalizar integração, notificações, realtime e deep links
**Requirements**: FR-2.2, FR-4.7, FR-7.1 → FR-7.3

| ID | Task | File | Status | Parallel |
|----|------|------|--------|----------|
| T033 | Add messaging tables to useRealtimeSync | `lib/realtime/useRealtimeSync.ts` | ✅ | |
| T034 | Create deep link page for conversations | `app/(protected)/messaging/[conversationId]/page.tsx` | ✅ | [P] |
| T035 | Add notification badge to Sidebar | `components/Layout.tsx` | ✅ | [P] |
| T036 | Add messaging design tokens to globals.css | `app/globals.css` | ✅ | [P] |
| T037 | Create ChannelSetupModal for channel editing | `features/messaging/components/Modals/ChannelSetupModal.tsx` | ✅ | |

### Test Criteria
- [x] Mensagens aparecem em tempo real via Supabase Realtime
- [x] Deep link `/messaging/[id]` abre conversa específica
- [x] Badge no Sidebar mostra count de não lidas
- [x] Design tokens (cores de canal, bolhas) aplicados
- [x] Canal pode ser editado/reconectado via modal

---

## Dependency Graph

```
Phase 1 (Setup)      ──┬──> Phase 3 (US1: Admin Config)
                      │
Phase 2 (Providers)  ──┼──> Phase 4 (US2: Recebe/Responde)
                      │
                      ├──> Phase 5 (US3: Inicia Conversa)
                      │
                      ├──> Phase 6 (US4: Filtros)
                      │
                      └──> Phase 7 (US5: Vinculação Auto)
                                    │
                                    ▼
                             Phase 8 (Polish)
```

**Notes**:
- Phases 3-7 can run in parallel after Phase 1 & 2
- Phase 8 should run last (integration/polish)

---

## Parallel Execution Examples

### Maximum Parallelism (7 tasks)

```bash
# Start all [P] tasks from Phase 3 & 4 simultaneously:
T014 & T015 & T021 & T022 & T023 & T025 & T034 & T035 & T036
```

### Conservative Parallelism (per phase)

```bash
# Phase 3:
T014 & T015  # Then T016 → T017 → T018 → T019 → T020

# Phase 4:
T021 & T022 & T023 & T025  # Then T024

# Phase 5-6:
T026 → T027  # Sequential
T028 → T029 → T030  # Sequential (same file)

# Phase 8:
T033 & T034 & T035 & T036  # Then T037
```

---

## Implementation Strategy

### MVP Scope (Recommended)

Complete in this order for fastest functional MVP:

1. **Phase 3 (T016-T020)**: Admin pode configurar sistema
2. **Phase 4 (T021-T025)**: Vendedor usa inbox básico
3. **Phase 8 (T033-T034)**: Realtime + deep links

This delivers: Admin setup → User messaging → Live updates

### Full Scope

After MVP, add:
- Phase 5 (Iniciar conversa)
- Phase 6 (Filtros avançados)
- Phase 7 (Vinculação manual)
- Phase 8 remaining (notifications, tokens)

---

## Checkpoint Markers

After each phase, verify:

| Phase | Checkpoint Verification |
|-------|------------------------|
| Phase 3 ✓ | `npm run build` passes, admin can create business unit |
| Phase 4 ✓ | Inbox shows conversations, messages render correctly |
| Phase 5 ✓ | New conversation modal works from contact page |
| Phase 6 ✓ | Filters and search return expected results |
| Phase 7 ✓ | Contact relinking works |
| Phase 8 ✓ | Realtime updates work, deep links work |

---

## Notes

1. **Tests not included** - Not explicitly requested in spec. Add test tasks if TDD approach desired.
2. **Instagram provider** - Deferred to Phase 5 (spec.md), not in current task list.
3. **Existing code** - ~65% already implemented, tasks only for remaining work.
4. **Tech stack** - All tasks use approved technologies from tech-stack.md.
