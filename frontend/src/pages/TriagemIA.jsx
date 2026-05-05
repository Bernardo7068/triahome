import { useEffect, useMemo, useState } from 'react';
import { cancelarTriagem, iniciarTriagem, responderTriagem, statusTriagem } from '../services/triagemService';

function mensagemFinal(resultado) {
  if (!resultado) return '';
  const partes = [];

  if (resultado.emoji || resultado.cor) {
    partes.push(`${resultado.emoji || ''} ${resultado.cor || ''}`.trim());
  }

  if (resultado.resultado) {
    partes.push(resultado.resultado);
  }

  return partes.join('\n\n');
}

export default function TriagemIA() {
  const [etapa, setEtapa] = useState('inicio');
  const [entrada, setEntrada] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [mensagemSistema, setMensagemSistema] = useState('');
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [estadoServidor, setEstadoServidor] = useState(null);

  const titulo = useMemo(() => {
    if (etapa === 'pergunta') return 'Entrevista de Triagem';
    if (etapa === 'resultado') return 'Resultado da Triagem';
    return 'Questionário de Triagem IA';
  }, [etapa]);

  const carregarEstadoServidor = async () => {
    try {
      const data = await statusTriagem();
      setEstadoServidor(data);
    } catch {
      setEstadoServidor(null);
    }
  };

  useEffect(() => {
    (async () => {
      await carregarEstadoServidor();
    })();
  }, []);

  const reiniciar = async () => {
    if (sessionId) {
      try {
        await cancelarTriagem(sessionId);
      } catch {
        // Ignorar se a sessão já expirou.
      }
    }

    setEtapa('inicio');
    setEntrada('');
    setSintomasIniciais('');
    setSessionId('');
    setMensagemSistema('');
    setResultado(null);
    setHistorico([]);
    setErro('');
    setACarregar(false);
    carregarEstadoServidor();
  };

  const submeterInicio = async (event) => {
    event.preventDefault();
    if (!entrada.trim()) return;

    setErro('');
    setACarregar(true);

    const texto = entrada.trim();

    try {
      const data = await iniciarTriagem(texto);

      setHistorico([{ tipo: 'utente', texto }]);

      if (data.tipo === 'resultado') {
        setResultado(data);
        setHistorico((atual) => [...atual, { tipo: 'ia', texto: mensagemFinal(data) }]);
        setEtapa('resultado');
        setMensagemSistema('');
        setSessionId(data.session_id || '');
        return;
      }

      setSessionId(data.session_id || '');
      setMensagemSistema(data.pergunta || 'Pode dar mais detalhes?');
      setHistorico((atual) => [...atual, { tipo: 'ia', texto: data.pergunta || 'Pode dar mais detalhes?' }]);
      setEtapa('pergunta');
      setEntrada('');
    } catch (error) {
      setErro(error.message || 'Falha ao iniciar a triagem.');
    } finally {
      setACarregar(false);
    }
  };

  const submeterResposta = async (event) => {
    event.preventDefault();
    if (!entrada.trim() || !sessionId) return;

    setErro('');
    setACarregar(true);

    const texto = entrada.trim();

    try {
      const data = await responderTriagem(sessionId, texto);
      setHistorico((atual) => [...atual, { tipo: 'utente', texto }]);

      if (data.tipo === 'resultado') {
        setResultado(data);
        setHistorico((atual) => [...atual, { tipo: 'ia', texto: mensagemFinal(data) }]);
        setEtapa('resultado');
        setMensagemSistema('');
        setEntrada('');
        setSessionId(data.session_id || sessionId);
        return;
      }

      setMensagemSistema(data.pergunta || 'Pode dar mais detalhes?');
      setHistorico((atual) => [...atual, { tipo: 'ia', texto: data.pergunta || 'Pode dar mais detalhes?' }]);
      setEntrada('');
    } catch (error) {
      setErro(error.message || 'Falha ao enviar a resposta.');
    } finally {
      setACarregar(false);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-5xl mx-auto space-y-6">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{titulo}</h1>
        <p className="text-slate-500">A IA faz uma pergunta de cada vez até ter informação suficiente para classificar a triagem.</p>
        {estadoServidor && (
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">
            Servidor: {estadoServidor.status} · Sessões ativas: {estadoServidor.sessoes_ativas}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 min-h-96">
            {historico.length === 0 ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center text-center text-slate-400">
                <p className="text-lg font-bold text-slate-500">Aguardando sintomas iniciais</p>
                <p className="mt-2 max-w-md">Escreva o que sente e a IA começa a entrevista automaticamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historico.map((mensagem, indice) => (
                  <div
                    key={`${mensagem.tipo}-${indice}`}
                    className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm whitespace-pre-wrap ${
                      mensagem.tipo === 'utente'
                        ? 'ml-auto bg-blue-600 text-white'
                        : 'mr-auto bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">
                      {mensagem.tipo === 'utente' ? 'Utilizador' : 'IA'}
                    </p>
                    <p className="leading-relaxed">{mensagem.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {erro && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 font-medium">
              {erro}
            </div>
          )}

          {resultado && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-3">
              <div className="text-sm font-bold uppercase tracking-widest text-blue-600">Resultado Final</div>
              <div className="text-2xl font-black text-slate-900">
                {resultado.emoji ? `${resultado.emoji} ` : ''}
                {resultado.cor || 'Resposta'}
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{resultado.resultado}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">{etapa === 'inicio' ? 'Primeira descrição' : 'Resposta seguinte'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {etapa === 'inicio'
                  ? 'Descreva os sintomas principais.'
                  : 'Responda à pergunta da IA com o máximo de detalhe útil.'}
              </p>
            </div>

            <form onSubmit={etapa === 'inicio' ? submeterInicio : submeterResposta} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">
                  {etapa === 'inicio' ? 'Sintomas iniciais' : mensagemSistema || 'Resposta'}
                </span>
                <textarea
                  value={entrada}
                  onChange={(event) => setEntrada(event.target.value)}
                  placeholder={etapa === 'inicio' ? 'Ex.: febre, tosse, dor no peito...' : 'Escreva a sua resposta aqui...'}
                  className="w-full min-h-36 rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-y"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={aCarregar || !entrada.trim()}
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aCarregar ? 'A enviar...' : etapa === 'inicio' ? 'Iniciar triagem' : 'Responder'}
                </button>

                <button
                  type="button"
                  onClick={reiniciar}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Reiniciar
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 space-y-2">
            <p className="font-bold text-slate-800">Fluxo</p>
            <p>1. Descreva sintomas iniciais.</p>
            <p>2. Responda uma pergunta de cada vez.</p>
            <p>3. No fim, a IA devolve cor, justificação e ação recomendada.</p>
            {sessionId && (
              <p className="pt-2 text-xs uppercase tracking-widest text-slate-400 break-all">Session ID: {sessionId}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
