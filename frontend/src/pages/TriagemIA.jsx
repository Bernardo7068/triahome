import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
import { cancelarTriagem, iniciarTriagem, responderTriagem, statusTriagem, guardarResultadoTriagem } from '../services/triagemService';

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

function parseResultado(texto) {
  /**
   * Extrai categoria, justificação e ação do texto da IA.
   * Exemplo:
   * "Categoria: Amarelo
   *  Justificação: Febre alta...
   *  Ação recomendada: Procurar médico..."
   */
  let categoria = '';
  let justificacao = '';
  let acao = '';

  const linhas = texto.split('\n');
  for (let linha of linhas) {
    const lower = linha.toLowerCase();
    // Corrigido: usar .includes() em vez de 'in' (que é para objetos)
    if (lower.includes('categoria') && linha.includes(':')) {
      categoria = linha.split(':')[1]?.trim() || '';
    } else if ((lower.includes('justif') || lower.includes('fundamentação')) && linha.includes(':')) {
      justificacao = linha.split(':')[1]?.trim() || '';
    } else if ((lower.includes('ação') || lower.includes('acao') || lower.includes('recomend')) && linha.includes(':')) {
      acao = linha.split(':')[1]?.trim() || '';
    }
  }

  // Fallback: tenta extrair a cor diretamente do texto
  const textLower = texto.toLowerCase();
  if (!categoria) {
    if (textLower.includes('vermelho')) categoria = 'Vermelho';
    else if (textLower.includes('laranja')) categoria = 'Laranja';
    else if (textLower.includes('amarelo')) categoria = 'Amarelo';
    else if (textLower.includes('verde')) categoria = 'Verde';
    else if (textLower.includes('azul') || textLower.includes('autocuidado')) categoria = 'Azul';
    else categoria = 'Amarelo'; // default
  }

  if (!justificacao) justificacao = texto.substring(0, 300);
  if (!acao) acao = 'Procurar atendimento médico imediatamente';

  return { categoria, justificacao, acao };
}

export default function TriagemIA({ user, onCancel }) {
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
        
        // Guardar resultado na BD
        try {
          const parsedResult = parseResultado(data.resultado);
          console.log('📤 Enviando resultado para guardar:', { userId: user?.id, parsed: parsedResult });
          
          const saveResponse = await guardarResultadoTriagem(
            user.id,
            parsedResult.categoria,
            parsedResult.justificacao,
            parsedResult.acao,
            texto
          );
          
          console.log('✅ Triagem guardada na BD com sucesso:', saveResponse);
          setMensagemSistema('✅ Triagem guardada! A secretaria pode validar agora.');
        } catch (err) {
          console.error('❌ Erro ao guardar triagem:', err);
          setErro(`⚠️ Triagem feita mas erro ao guardar: ${err.message}`);
        }
        
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
        
        // Guardar resultado na BD
        try {
          const parsedResult = parseResultado(data.resultado);
          console.log('📤 Enviando resultado (resposta) para guardar:', { userId: user?.id, parsed: parsedResult });
          
          const saveResponse = await guardarResultadoTriagem(
            user.id,
            parsedResult.categoria,
            parsedResult.justificacao,
            parsedResult.acao,
            texto
          );
          
          console.log('✅ Triagem guardada na BD com sucesso:', saveResponse);
          setMensagemSistema('✅ Triagem guardada! A secretaria pode validar agora.');
        } catch (err) {
          console.error('❌ Erro ao guardar triagem:', err);
          setErro(`⚠️ Triagem feita mas erro ao guardar: ${err.message}`);
        }
        
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
    <div className="pt-2 pb-6 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr_350px] gap-6 items-start max-w-[1600px] mx-auto">
        
        {/* CAIXA 1: INFORMAÇÕES (ESQUERDA) */}
        <aside className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col justify-between lg:h-[calc(100vh-160px)]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-[11px] tracking-widest">
              <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
              Triagem Médica IA
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-tight">
                Questionário de Triagem IA
              </h1>
              <p className="text-slate-400 text-sm font-bold leading-tight">
                Responda às questões para avaliarmos a sua prioridade clínica em tempo real.
              </p>
            </div>
          </div>

          {estadoServidor && (
            <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[12px] font-black uppercase text-slate-300 tracking-widest">Servidor</span>
              <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <div className="w-1 h-1 rounded-full bg-green-500"></div>
                <span className="text-[11px] font-black text-green-600 uppercase">Online</span>
              </div>
            </div>
          )}
        </aside>

        {/* CAIXA 2: HISTÓRICO DE CONVERSA (CENTRO) */}
        <main className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-[400px] lg:h-[calc(100vh-160px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {historico.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 max-w-xs">
                  <Activity size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-base font-black text-slate-800 mb-1">Entrevista Clínica</p>
                  <p className="text-slate-400 text-sm font-medium leading-tight">O seu histórico de conversação com a IA médica aparecerá aqui.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {historico.map((mensagem, indice) => (
                  <div
                    key={`${mensagem.tipo}-${indice}`}
                    className={`max-w-[90%] ${
                      mensagem.tipo === 'utente' ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div className={`px-5 py-3 rounded-[1.5rem] shadow-sm font-medium text-base leading-relaxed ${
                      mensagem.tipo === 'utente'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      <p className={`text-[12px] font-black uppercase tracking-widest mb-1 ${
                        mensagem.tipo === 'utente' ? 'text-blue-200' : 'text-slate-400'
                      }`}>
                        {mensagem.tipo === 'utente' ? 'Você' : 'Assistente IA'}
                      </p>
                      {mensagem.texto}
                    </div>
                  </div>
                ))}

                {resultado && (
                  <div className="pt-2">
                    <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl space-y-3">
                      <div className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Resultado Final
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tighter italic leading-none">
                          {resultado.emoji} {resultado.cor}
                        </h2>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed italic font-medium border-l-2 border-blue-600 pl-4">
                        "{resultado.resultado}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* CAIXA 3: INTERAÇÃO E CONTROLOS (DIREITA) */}
        <aside className="space-y-4 lg:h-[calc(100vh-160px)] flex flex-col">
          
          {/* INPUT BOX */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4 flex-1 flex flex-col min-h-0">
             <form onSubmit={etapa === 'inicio' ? submeterInicio : submeterResposta} className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">
                  Descreva o problema
                </label>
                <textarea
                  autoFocus
                  value={entrada}
                  onChange={(event) => setEntrada(event.target.value)}
                  placeholder={etapa === 'inicio' ? 'Ex.: Sinto uma dor forte...' : 'Responda aqui...'}
                  className="w-full flex-1 min-h-[100px] rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/50 p-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium resize-none text-sm text-slate-700 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={aCarregar || !entrada.trim()}
                className="w-full inline-flex items-center justify-center rounded-[1.25rem] bg-blue-500 hover:bg-blue-600 py-4 font-black text-white transition-all shadow-lg shadow-blue-200 disabled:opacity-50 uppercase text-xs tracking-widest"
              >
                {aCarregar ? 'A analisar...' : 'Enviar'}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={reiniciar}
                className="text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] transition-colors"
              >
                Reiniciar
              </button>
            </div>
          </div>

          {/* EXIT BOX */}
          <button
            onClick={onCancel}
            className="w-full bg-slate-100 hover:bg-white border border-slate-200 rounded-[1.25rem] p-4 flex items-center justify-center gap-3 transition-all group shadow-sm"
          >
            <ArrowLeft size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span className="text-[11px] font-black uppercase text-slate-400 group-hover:text-slate-900 tracking-widest">Sair</span>
          </button>

        </aside>

      </div>
    </div>
  );
}
