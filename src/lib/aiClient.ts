type FallbackType = 'low_balance' | 'rate_limit' | 'server_error' | 'network' | 'unknown';

export interface FallbackMessage {
  type: FallbackType;
  title: string;
  text: string;
  cta?: { label: string; action: 'openBilling' | 'sendReport' };
  details?: unknown;
}

function buildFallback(type: FallbackType, details?: unknown): FallbackMessage {
  const map: Record<FallbackType, Omit<FallbackMessage, 'type' | 'details'>> = {
    low_balance: {
      title: '\uD83D\uDCB3 Закончился лимит',
      text: 'Баланс кабинета исчерпан. Пополни баланс чтобы продолжить пользоваться AI-ассистентом.',
      cta: { label: 'Пополнить баланс', action: 'openBilling' },
    },
    rate_limit: {
      title: '\u23F1 Слишком много запросов',
      text: 'Подожди 30 секунд и попробуй ещё раз.',
    },
    server_error: {
      title: '\u26A0\uFE0F Временный сбой на стороне Anthropic',
      text: 'Это не у тебя. Попробуй через минуту, или сообщи в поддержку.',
      cta: { label: 'Сообщить в поддержку', action: 'sendReport' },
    },
    network: {
      title: '\uD83D\uDCE1 Нет связи',
      text: 'Проверь интернет.',
    },
    unknown: {
      title: '\u274C Что-то пошло не так',
      text: 'Неизвестная ошибка. Можешь отправить отчёт — я разберусь.',
      cta: { label: 'Отправить отчёт', action: 'sendReport' },
    },
  };
  return { type, ...map[type], details };
}

export async function callAI(
  message: string,
  opts: { activeScheme?: Record<string, number>; deficits?: { title: string }[]; zoneContext?: string }
): Promise<{ ok: true; data: { response: string } } | { ok: false; fallback: FallbackMessage }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, activeScheme: opts.activeScheme, deficits: opts.deficits, zoneContext: opts.zoneContext }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (
        err.error?.type === 'invalid_request_error' &&
        err.error?.message?.includes('credit balance')
      ) {
        return { ok: false, fallback: buildFallback('low_balance') };
      }
      if (res.status === 429) return { ok: false, fallback: buildFallback('rate_limit') };
      if (res.status >= 500) return { ok: false, fallback: buildFallback('server_error', err) };
      return { ok: false, fallback: buildFallback('unknown', err) };
    }
    return { ok: true, data: await res.json() };
  } catch (e) {
    return { ok: false, fallback: buildFallback('network', e) };
  }
}

export function handleFallbackAction(action: 'openBilling' | 'sendReport') {
  if (action === 'openBilling') {
    console.log('billing not implemented');
  } else if (action === 'sendReport') {
    console.log('report not implemented');
  }
}
