import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import { Clock, CheckCircle, Volume2, PlusCircle, History, FileText, Printer, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UtenteDashboard({ user }) {
  const navigate = useNavigate();
  const [estadoAtivo, setEstadoAtivo] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // 1. Verificar estado atual
        const resEstado = await api.get(`/triagens/estado/${user.id}`);
        // CORREÇÃO: A View usa 'triagem_id', não 'id'
        setEstadoAtivo(resEstado.data && resEstado.data.triagem_id ? resEstado.data : null);

        // 2. Carregar Histórico
        const resHist = await api.get(`/historico/${user.id}/utente`);
        setHistorico(resHist.data || []);
      } catch (e) {
        console.error("Erro ao carregar dados do utente");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
    const timer = setInterval(carregarDados, 5000);
    return () => clearInterval(timer);
  }, [user.id]);

  if (loading) return <div className="p-10 text-center font-bold animate-pulse text-slate-400">A carregar portal do utente...</div>;

  // --- COMPONENTE INTERNO: RELATÓRIO/RECIBO ---
  const ModalRelatorio = ({ dados, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X /></button>
        
        <div id="print-area" className="p-10 font-mono text-sm text-slate-800">
          <div className="text-center border-b-2 border-dashed pb-6 mb-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Relatório de Atendimento</h2>
            <p className="font-bold">{dados.nome_hospital || "Hospital de Ourém"}</p>
            <p className="text-[10px] opacity-60">Serviço de Urgência Digital</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between"><span>DATA:</span> <span className="font-bold">{new Date(dados.data_consulta).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>UTENTE:</span> <span className="font-bold">{dados.nome_utente}</span></div>
            <div className="flex justify-between"><span>Nº UTENTE:</span> <span>{dados.nr_utente}</span></div>
            <div className="flex justify-between"><span>MÉDICO:</span> <span>{dados.nome_medico} ({dados.especialidade})</span></div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
            <p className="text-[10px] font-black text-blue-600 mb-2 uppercase">Diagnóstico Clínico</p>
            <p className="italic text-base mb-4">"{dados.diagnostico}"</p>
            <p className="text-[10px] font-black text-blue-600 mb-2 uppercase">Prescrição e Recomendações</p>
            <p className="italic">"{dados.prescricao}"</p>
          </div>

          <div className="border-t-2 border-dashed pt-6">
            <div className="flex justify-between text-lg font-black">
              <span>TAXA MODERADORA:</span>
              <span>{dados.cor_manchester === 'vermelho' ? '0.00€' : '15.00€'}</span>
            </div>
            <p className="text-[9px] mt-4 opacity-50 text-center uppercase">Este documento serve de comprovante de presença e relatório médico.</p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 flex gap-3">
          <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            <Printer size={18}/> Imprimir PDF
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* 1. SECÇÃO DE ESTADO ATUAL (O que já tinhas, corrigido) */}
      <section>
        {estadoAtivo ? (
          <>
            {/* CASO: EM CONSULTA */}
            {estadoAtivo.estado_fila === 'em_consulta' && (
              <div className="bg-blue-600 text-white p-10 rounded-[3rem] shadow-2xl text-center animate-pulse">
                <Volume2 size={64} className="mx-auto mb-6" />
                <h2 className="text-4xl font-black mb-2 italic tracking-tighter">Sua Vez!</h2>
                <p className="text-blue-100 text-xl font-medium">Dirija-se ao <span className="bg-white text-blue-600 px-4 py-1 rounded-xl font-black">GABINETE {estadoAtivo.gabinete || '3'}</span></p>
              </div>
            )}

            {/* CASO: SALA DE ESPERA */}
            {(estadoAtivo.estado_triagem === 'em_espera' || estadoAtivo.estado_fila === 'aguardar') && (
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border text-center">
                <CheckCircle size={60} className="text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Entrada Validada</h2>
                <p className="text-slate-500 mt-2 mb-8 font-medium">Aguarde na Sala de Espera Geral. Será chamado pela cor.</p>
                <BadgePrioridade cor={estadoAtivo.cor_manchester} />
              </div>
            )}

            {/* CASO: PENDENTE (ANA) */}
            {(estadoAtivo.estado_triagem === 'pendente' || estadoAtivo.estado_triagem === 'checkin_feito') && (
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl text-center">
                <Clock size={48} className="text-blue-400 mx-auto mb-6 animate-pulse" />
                <h2 className="text-2xl font-black mb-4">Triagem Concluída</h2>
                <p className="text-slate-400 mb-6 font-medium">Dirija-se ao hospital para validar a sua entrada.</p>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 inline-block px-10">
                   <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Senha Virtual</p>
                   <p className="text-3xl font-mono font-black">#{estadoAtivo.triagem_id}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* CASO: SEM CONSULTA ATIVA */
          <div className="text-center p-12 bg-white rounded-[3rem] border shadow-sm">
            <PlusCircle size={48} className="text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Olá, {user.nome}!</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">Não tem nenhuma triagem ativa. Se não se sente bem, use a nossa IA.</p>
            <button onClick={() => navigate('/nova-triagem')} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-blue-100">Nova Triagem IA</button>
          </div>
        )}
      </section>

      {/* 2. SECÇÃO DE HISTÓRICO (NOVIDADE) */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 px-4">
          <History size={20} className="text-blue-600" /> Histórico de Consultas
        </h3>

        {historico.length > 0 ? (
          <div className="grid gap-3">
            {historico.map((h, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl"><FileText className="text-slate-400" size={24}/></div>
                  <div>
                    <p className="font-black text-slate-800">{new Date(h.data_consulta).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase">{h.nome_hospital || "Hospital de Ourém"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRelatorioSelecionado(h)}
                  className="bg-slate-50 text-slate-900 px-6 py-2 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all"
                >
                  Ver Relatório
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center border-2 border-dashed rounded-[2rem] text-slate-300 font-bold italic">
            Ainda não possui registos de consultas anteriores.
          </div>
        )}
      </section>

      {/* MODAL DO RELATÓRIO */}
      {relatorioSelecionado && (
        <ModalRelatorio 
          dados={relatorioSelecionado} 
          onClose={() => setRelatorioSelecionado(null)} 
        />
      )}
    </div>
  );
}