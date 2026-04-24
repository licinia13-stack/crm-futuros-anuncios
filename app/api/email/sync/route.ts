import { NextRequest, NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createStaticAdminClient } from '@/lib/supabase/staticAdminClient';

export const runtime = 'nodejs';
export const maxDuration = 60;

const FROM_EMAIL = 'geral@futurosanuncios.com';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createStaticAdminClient();

  const { data: channel } = await supabase
    .from('messaging_channels')
    .select('id, organization_id, business_unit_id')
    .eq('channel_type', 'email')
    .eq('external_identifier', FROM_EMAIL)
    .is('deleted_at', null)
    .maybeSingle();

  if (!channel) {
    return NextResponse.json({ error: 'Canal email não encontrado' }, { status: 404 });
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.hostinger.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: process.env.IMAP_USER || FROM_EMAIL,
      pass: process.env.IMAP_PASS || '',
    },
    logger: false,
  });

  let imported = 0;
  let skipped = 0;

  try {
    await client.connect();

    const lock = await client.getMailboxLock('INBOX');
    try {
      const uids = await client.search({ seen: false }, { uid: true });
      const uidList = Array.isArray(uids) ? uids : [];

      if (uidList.length > 0) {
        for await (const msg of client.fetch(uidList, { source: true, uid: true }, { uid: true })) {
          try {
            const parsed = await simpleParser(msg.source as Buffer);

            const messageId = parsed.messageId;
            const fromAddr = parsed.from?.value?.[0];
            const senderEmail = fromAddr?.address?.toLowerCase();
            const senderName = fromAddr?.name || senderEmail || 'Desconhecido';
            const subject = parsed.subject || '(sem assunto)';
            const date = parsed.date || new Date();
            const inReplyTo = parsed.inReplyTo?.trim() || null;
            const textBody = parsed.text || '';
            const htmlBody = typeof parsed.html === 'string' ? parsed.html : undefined;

            // Skip emails without sender or message-id, and skip our own sent emails
            if (!senderEmail || !messageId || senderEmail === FROM_EMAIL.toLowerCase()) {
              await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen'], { uid: true });
              skipped++;
              continue;
            }

            // Deduplicate by Message-ID
            const { data: existing } = await supabase
              .from('messaging_messages')
              .select('id')
              .eq('external_id', messageId)
              .maybeSingle();

            if (existing) {
              await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen'], { uid: true });
              skipped++;
              continue;
            }

            // Find conversation — first try In-Reply-To, then by sender email
            let conversationId: string | null = null;
            let contactId: string | null = null;

            if (inReplyTo) {
              const { data: original } = await supabase
                .from('messaging_messages')
                .select('conversation_id')
                .eq('external_id', inReplyTo)
                .maybeSingle();
              if (original) conversationId = original.conversation_id;
            }

            if (!conversationId) {
              const { data: existingConv } = await supabase
                .from('messaging_conversations')
                .select('id, contact_id')
                .eq('channel_id', channel.id)
                .eq('external_contact_id', senderEmail)
                .maybeSingle();

              if (existingConv) {
                conversationId = existingConv.id;
                contactId = existingConv.contact_id;
              }
            }

            // No conversation → find or create contact, then create conversation
            if (!conversationId) {
              const { data: existingContact } = await supabase
                .from('contacts')
                .select('id')
                .eq('organization_id', channel.organization_id)
                .eq('email', senderEmail)
                .is('deleted_at', null)
                .maybeSingle();

              if (existingContact) {
                contactId = existingContact.id;
              } else {
                const { data: newContact } = await supabase
                  .from('contacts')
                  .insert({
                    organization_id: channel.organization_id,
                    name: senderName,
                    email: senderEmail,
                    source: 'email',
                  })
                  .select('id')
                  .single();
                contactId = newContact?.id ?? null;
              }

              const { data: newConv } = await supabase
                .from('messaging_conversations')
                .insert({
                  organization_id: channel.organization_id,
                  channel_id: channel.id,
                  business_unit_id: channel.business_unit_id,
                  external_contact_id: senderEmail,
                  external_contact_name: senderName,
                  contact_id: contactId,
                  status: 'open',
                  priority: 'normal',
                })
                .select('id')
                .single();

              conversationId = newConv?.id ?? null;
            }

            if (!conversationId) {
              console.error('[email-sync] Falha ao obter conversa para', senderEmail);
              skipped++;
              continue;
            }

            // Insert inbound message
            const content: Record<string, unknown> = {
              type: 'text',
              subject,
              text: textBody,
            };
            if (htmlBody) content.html = htmlBody;

            const { error: insertErr } = await supabase.from('messaging_messages').insert({
              conversation_id: conversationId,
              external_id: messageId,
              direction: 'inbound',
              content_type: 'text',
              content,
              status: 'delivered',
              delivered_at: date.toISOString(),
              sender_name: senderName,
              metadata: {
                from: senderEmail,
                subject,
                in_reply_to: inReplyTo,
              },
            });

            if (insertErr) {
              console.error('[email-sync] Erro ao inserir mensagem:', insertErr.message);
              skipped++;
              continue;
            }

            // Mark as seen so we don't re-import on next poll
            await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen'], { uid: true });

            imported++;
            console.log(`[email-sync] Importado de ${senderEmail}: ${subject}`);
          } catch (msgErr) {
            console.error('[email-sync] Erro a processar mensagem:', msgErr);
            skipped++;
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return NextResponse.json({ ok: true, imported, skipped });
  } catch (error) {
    console.error('[email-sync] Erro IMAP:', error);
    try { await client.logout(); } catch { /* ignore */ }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
