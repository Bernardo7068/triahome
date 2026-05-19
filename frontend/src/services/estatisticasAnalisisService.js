// Serviço para chamar o servidor de análise de estatísticas (porta 5001)
const BASE_URL = import.meta.env.VITE_ESTATISTICAS_URL || 'http://127.0.0.1:5001';

async function analisarEstatisticas(payload) {
  /**
   * Envia os dados da página de estatísticas para a IA analisar
   * payload deve conter: estatisticas, triagens, sintomas_top, resumo, source
   */
  try {
    const res = await fetch(`${BASE_URL}/analisar-estatisticas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.erro || data?.message || `Erro na análise (${res.status})`);
    }

    return data;
  } catch (e) {
    throw new Error(e.message || 'Erro ao chamar serviço de análise');
  }
}

async function listarAnalises() {
  /**
   * Lista todas as análises guardadas
   */
  try {
    const res = await fetch(`${BASE_URL}/analises`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.erro || `Erro ao listar análises (${res.status})`);
    }

    return data;
  } catch (e) {
    throw new Error(e.message || 'Erro ao listar análises');
  }
}

async function obterAnalise(analiseId) {
  /**
   * Obtém os detalhes de uma análise específica
   */
  try {
    const res = await fetch(`${BASE_URL}/analises/${analiseId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.erro || `Erro ao obter análise (${res.status})`);
    }

    return data;
  } catch (e) {
    throw new Error(e.message || 'Erro ao obter análise');
  }
}

async function statusServidor() {
  /**
   * Verifica o estado do servidor de análise
   */
  try {
    const res = await fetch(`${BASE_URL}/status`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.erro || `Erro ao obter estado (${res.status})`);
    }

    return data;
  } catch (e) {
    throw new Error(e.message || 'Erro ao verificar servidor');
  }
}

export { analisarEstatisticas, listarAnalises, obterAnalise, statusServidor };
