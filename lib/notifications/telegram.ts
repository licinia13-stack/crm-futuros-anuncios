const TELEGRAM_API = 'https://api.telegram.org';

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> {
  const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}

interface HandoffMessageParams {
  contactName: string;
  dealTitle: string;
  stageName: string;
  lastMessage: string;
  appUrl?: string;
  dealId?: string;
}

export function formatHandoffMessage({
  contactName,
  dealTitle,
  stageName,
  lastMessage,
  appUrl,
  dealId,
}: HandoffMessageParams): string {
  const lines = [
    `🔔 <b>Lead precisa de atenção humana</b>`,
    ``,
    `👤 <b>Contato:</b> ${contactName}`,
    `💼 <b>Deal:</b> ${dealTitle}`,
    `📍 <b>Estágio:</b> ${stageName}`,
    ``,
    `💬 <b>Última mensagem:</b>`,
    `<i>${lastMessage.slice(0, 300)}${lastMessage.length > 300 ? '...' : ''}</i>`,
  ];
  if (appUrl && dealId) {
    lines.push(``);
    lines.push(`🔗 <a href="${appUrl}/deals/${dealId}">Abrir no CRM</a>`);
  }
  return lines.join('\n');
}
