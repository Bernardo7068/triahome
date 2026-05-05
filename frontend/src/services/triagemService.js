const BASE_URL = 'http://192.168.67.251:5000';

async function requestJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { erro: await res.text() };

  if (!res.ok) {
    throw new Error(data?.erro || data?.message || `Erro na triagem (${res.status})`);
  }

  return data;
}

export function iniciarTriagem(sintomas) {
  return requestJson('/iniciar', { sintomas });
}

export function responderTriagem(sessionId, resposta) {
  return requestJson('/responder', { session_id: sessionId, resposta });
}

export function cancelarTriagem(sessionId) {
  return requestJson('/cancelar', { session_id: sessionId });
}

export function statusTriagem() {
  return fetch(`${BASE_URL}/status`).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.erro || `Erro ao obter estado (${res.status})`);
    }
    return data;
  });
}

