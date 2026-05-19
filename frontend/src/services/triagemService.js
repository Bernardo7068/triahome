// Prefer environment variable for remote triagem service, fallback to localhost
const BASE_URL = import.meta.env.VITE_TRIAGEM_URL || 'http://192.168.67.251:5000';

async function requestJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    // do not send credentials by default; enable if your API requires cookies
    // credentials: 'include',
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

export function guardarResultadoTriagem(utenteId, categoria, justificacao, acao, resumoClinico) {
  /**
   * Envia o resultado final da IA para o backend Laravel guardar na BD
   */
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  return fetch(`${API_URL}/triagem/guardar-resultado`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      utente_id: utenteId,
      hospital_id: 1, // Pode vir de variável de ambiente
      categoria,
      justificacao,
      acao,
      resumo_clinico: resumoClinico
    })
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Erro ao guardar triagem (${res.status})`);
    }
    return data;
  });
}

