import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import ModalRelatorio from "./RelatorioConsulta";
import TriagemAI from "./TriagemIA";
import { Clock, CheckCircle, Volume2, PlusCircle, History, FileText, Activity, ArrowLeft } from "lucide-react";

export default function UtenteDashboard({ user }) {
  const [estadoAtivo, setEstadoAtivo] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("inicio");

  const [iniciandoTriagem, setIniciandoTriagem] = useState(false);

  const carregarDados = async () => {
    try {
      const resEstado = await api.get(`/triagens/estado/${user.id}`);
      const dadosEstado = resEstado.data && resEstado.data.triagem_id ? resEstado.data : null;
      setEstadoAtivo(dadosEstado);

      if (dadosEstado) {
        setIniciandoTriagem(false);
      }

      const resHist = await api.get(`/historico/${user.id}/utente`);
      setHistorico(resHist.data || []);
    } catch (e) {
      console.error("Erro ao carregar dados do utente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    const timer = setInterval(carregarDados, 5000);
    return () => clearInterval(timer);
  }, [user.id]);

  if (loading) return <div className="p-10 text-center font-bold animate-pulse text-slate-400">A carregar portal do utente...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      {/* MENU DE NAVEGAÇÃO DO UTENTE */}
      <div className="flex gap-4 mb-6 bg-white p-2 rounded-3xl shadow-sm border max-w-xl mx-auto">
        <button
          onClick={() => { setAbaAtiva("inicio"); setIniciandoTriagem(false); }}
          className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'inicio' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Activity size={20} /> Estado Atual
        </button>
        <button
          onClick={() => { setAbaAtiva("historico"); setIniciandoTriagem(false); }}
          className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'historico' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <History size={20} /> Histórico
        </button>
      </div>

      {abaAtiva === "inicio" && (
        <section className="animate-in fade-in duration-300">
          {estadoAtivo ? (
            /* ==============================================================
               ZONA 1: O UTENTE TEM UMA TRIAGEM ATIVA (EM ESPERA / CONSULTA)
               ============================================================== */
            <>
              {estadoAtivo.estado_fila === 'em_consulta' && (
                <div className="bg-blue-600 text-white p-12 rounded-[3.5rem] shadow-2xl text-center animate-pulse">
                  <Volume2 size={64} className="mx-auto mb-6" />
                  <h2 className="text-5xl font-black mb-4 italic tracking-tighter">Sua Vez!</h2>
                  <p className="text-blue-100 text-2xl font-medium">Dirija-se ao <span className="bg-white text-blue-600 px-6 py-2 rounded-2xl font-black shadow-lg">GABINETE {estadoAtivo.gabinete || '3'}</span></p>
                </div>
              )}

              {(estadoAtivo.estado_triagem === 'em_espera' || estadoAtivo.estado_fila === 'aguardar') && (
                <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border text-center">
                  <CheckCircle size={80} className="text-green-500 mx-auto mb-8" />
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">Entrada Validada</h2>
                  <p className="text-slate-500 mb-10 font-medium text-lg">Aguarde na Sala de Espera Geral. Será chamado pela cor.</p>
                  <BadgePrioridade cor={estadoAtivo.cor_manchester} />
                </div>
              )}

              {(estadoAtivo.estado_triagem === 'pendente' || estadoAtivo.estado_triagem === 'checkin_feito') && (
                <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl text-center">
                  <Clock size={64} className="text-blue-400 mx-auto mb-8 animate-pulse" />
                  <h2 className="text-3xl font-black mb-4 tracking-tighter">Triagem Concluída</h2>
                  <p className="text-slate-400 mb-8 font-medium text-lg">Dirija-se ao hospital para validar a sua entrada presencialmente.</p>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 inline-block px-12">
                    <p className="text-xs text-blue-400 font-black uppercase tracking-widest mb-2">Senha Virtual</p>
                    <p className="text-4xl font-mono font-black">#{estadoAtivo.triagem_id}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ==============================================================
               ZONA 2: O UTENTE NÃO TEM TRIAGEM (MOSTRAR BOTÃO OU FORMULÁRIO)
               ============================================================== */
            
            /* A MÁGICA ACONTECE AQUI: A caixa muda de max-w-xl (pequena) para max-w-4xl (grande) */
            <div className={`bg-white rounded-[3.5rem] border shadow-sm mx-auto overflow-hidden transition-all duration-700 ease-in-out transform origin-top ${iniciandoTriagem ? 'max-w-4xl opacity-100' : 'max-w-xl'}`}>

              {!iniciandoTriagem ? (
                // 2.1 - O BOTÃO INICIAL
                <div className="text-center p-12 md:p-16 animate-in zoom-in-95 duration-300">
                  <PlusCircle size={64} className="text-blue-600 mx-auto mb-8" />
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Olá, {user.nome}!</h2>
                  <p className="text-slate-500 mb-10 font-medium text-lg">Não tem nenhuma triagem ativa. Se não se sente bem, inicie agora a triagem digital.</p>

                  <button
                    onClick={() => setIniciandoTriagem(true)}
                    className="bg-blue-600 text-white w-full py-6 rounded-[2rem] font-black text-xl hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 transform hover:-translate-y-1"
                  >
                    Nova Triagem IA
                  </button>
                </div>
              ) : (
                // 2.2 - O FORMULÁRIO DA IA ABERTO
                <div className="p-8 md:p-12 animate-in fade-in duration-700">
                  <button
                    onClick={() => setIniciandoTriagem(false)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold mb-6 transition-colors bg-slate-50 px-6 py-3 rounded-full w-fit"
                  >
                    <ArrowLeft size={20} /> Cancelar e Voltar
                  </button>

                  <div className="border-t border-slate-100 pt-6">
                    <TriagemAI
                      user={user}
                      onConcluido={() => {
                        carregarDados();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {abaAtiva === "historico" && (
        <section className="space-y-4 animate-in fade-in duration-300">
          {historico.length > 0 ? (
            <div className="grid gap-4">
              {historico.map((h, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl"><FileText className="text-blue-600" size={32} /></div>
                    <div>
                      <p className="font-black text-xl text-slate-800">{new Date(h.data_consulta).toLocaleDateString()}</p>
                      <p className="text-sm text-slate-400 font-bold uppercase">{h.nome_hospital || "Hospital de Ourém"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRelatorioSelecionado(h)}
                    className="bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Ver Relatório
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center border-2 border-dashed rounded-[3rem] text-slate-400 font-medium text-lg">
              Ainda não possui registos de consultas anteriores.
            </div>
          )}
        </section>
      )}

      {relatorioSelecionado && <ModalRelatorio dados={relatorioSelecionado} onClose={() => setRelatorioSelecionado(null)} />}
    </div>
  );
}