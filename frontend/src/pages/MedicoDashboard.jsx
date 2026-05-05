import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import { Stethoscope, Play, Send, User, Clock, Eye, X, History, CheckCircle, Printer, AlertCircle } from "lucide-react";

export default function MedicoDashboard({ user }) {
  const [fila, setFila] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("espera"); // 'espera', 'historico' ou 'consulta'
  const [consultaAtiva, setConsultaAtiva] = useState(null);
  const [pacientePopup, setPacientePopup] = useState(null);
  const [relatorio, setRelatorio] = useState({ diagnostico: "", prescricao: "", notas_clinicas: "" });
  const [relatorioParaVer, setRelatorioParaVer] = useState(null);

const carregarDados = async () => {
  try {
    // Filtra a fila para o hospital do médico
    const resFila = await api.get(`/medico/fila?hospital_id=${user.hospital_id}`);
    setFila(resFila.data);
    
    // Se quiseres que o histórico seja apenas deste hospital:
    const resHist = await api.get(`/historico/${user.id}/medico?hospital_id=${user.hospital_id}`);
    setHistorico(resHist.data || []);
  } catch (e) { console.error(e); }
};

  useEffect(() => { carregarDados(); }, []);

  const chamarProximo = async () => {
    try {
      const res = await api.get('/medico/proximo');
      if (res.data && res.data.nome_utente) {
        setConsultaAtiva(res.data);
        setAbaAtiva("consulta"); // Força a ida para a aba da consulta
        carregarDados();
      }
    } catch (e) {
      const erro = e.response?.data?.message || "Sem pacientes na fila";
      alert(erro);
    }
  };

  const finalizarConsulta = async () => {
    if (!relatorio.diagnostico || !relatorio.prescricao) {
      alert("Por favor, preencha o diagnóstico e a prescrição.");
      return;
    }

    try {
      await api.post(`/consultas/finalizar`, {
        triagem_id: consultaAtiva.triagem_id,
        medico_id: user.id,
        utente_id: consultaAtiva.utente_id,
        diagnostico: relatorio.diagnostico,
        prescricao: relatorio.prescricao,
        notas_clinicas: relatorio.notas_clinicas
      });
      
      alert("Consulta finalizada e relatório gerado!");
      setConsultaAtiva(null);
      setRelatorio({ diagnostico: "", prescricao: "", notas_clinicas: "" });
      setAbaAtiva("espera"); // Volta para a sala de espera
      carregarDados();
    } catch (e) { 
      console.error(e);
      alert("Erro ao finalizar consulta no servidor."); 
    }
  };

  // --- MODAL DE RELATÓRIO OMITIDO AQUI PARA POUPAR ESPAÇO, MAS MANTÉM O TEU ---
  // (Podes colar aqui o const ModalVisualizarRelatorio = ... que já tinhas)
  const ModalVisualizarRelatorio = ({ dados, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><X /></button>
        <div className="p-12 font-mono text-sm text-slate-800">
          <div className="text-center border-b-2 border-dashed pb-8 mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Relatório Clínico</h2>
            <p className="font-bold text-blue-600">Serviço Nacional de Saúde - Ourém</p>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div><p className="text-[10px] uppercase text-slate-400 font-bold">Paciente</p><p className="font-black text-lg">{dados.nome_utente}</p></div>
            <div><p className="text-[10px] uppercase text-slate-400 font-bold">Data da Consulta</p><p className="font-black text-lg">{new Date(dados.data_consulta).toLocaleDateString()}</p></div>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8 space-y-6">
            <div><p className="text-[10px] font-black text-blue-600 mb-2 uppercase italic tracking-widest">Diagnóstico Efetuado</p><p className="text-base font-medium leading-relaxed">"{dados.diagnostico}"</p></div>
            <div><p className="text-[10px] font-black text-green-600 mb-2 uppercase italic tracking-widest">Prescrição / Tratamento</p><p className="text-base font-medium leading-relaxed">"{dados.prescricao}"</p></div>
          </div>
          <div className="text-center opacity-40 text-[9px] uppercase mt-12"><p>Documento validado pelo Dr. {user.nome}</p><p className="mt-1">ID Atendimento: #{dados.triagem_id}</p></div>
        </div>
        <div className="bg-slate-50 p-6 flex justify-center"><button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"><Printer size={18}/> Imprimir / PDF</button></div>
      </div>
    </div>
  );

  const listaEspera = fila.filter(p => p.estado_fila === 'aguardar');

  return (
    <div className="space-y-6">
      
      {/* MENU DE NAVEGAÇÃO FIXO */}
      <div className="flex gap-4 mb-6 bg-white p-2 rounded-3xl shadow-sm border">
        <button 
          onClick={() => setAbaAtiva("espera")}
          className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'espera' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Clock size={20}/> Sala de Espera ({listaEspera.length})
        </button>
        <button 
          onClick={() => setAbaAtiva("historico")}
          className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'historico' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <History size={20}/> Atendimentos ({historico.length})
        </button>

        {/* ABA DE CONSULTA ATIVA (SÓ APARECE SE HOUVER PACIENTE) */}
        {consultaAtiva && (
          <button 
            onClick={() => setAbaAtiva("consulta")}
            className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'consulta' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-red-50 text-red-500 border border-red-200'}`}
          >
            <AlertCircle size={20} className={abaAtiva !== 'consulta' ? "animate-pulse" : ""}/> 
            Em Consulta: {consultaAtiva.nome_utente.split(' ')[0]}
          </button>
        )}
      </div>

      {/* RENDERIZAÇÃO DA ABA ATIVA */}
      {abaAtiva === "espera" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] border flex justify-between items-center shadow-sm">
            <h2 className="text-2xl font-black flex items-center gap-2 tracking-tighter"><Stethoscope className="text-blue-600"/> Próximos Pacientes</h2>
            <button onClick={chamarProximo} disabled={listaEspera.length === 0 || consultaAtiva} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center gap-2">
              <Play fill="currentColor" size={18}/> Chamar Próximo
            </button>
          </div>
          {consultaAtiva && <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl border border-amber-200 text-center font-bold text-sm mb-4">Tem uma consulta a decorrer. Termine-a antes de chamar o próximo.</div>}
          <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr><th className="p-6">Prioridade</th><th className="p-6">Utente</th><th className="p-6 text-right">Ação</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaEspera.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                    <td className="p-6 font-bold text-slate-700">{p.nome_utente}</td>
                    <td className="p-6 text-right"><button onClick={() => setPacientePopup(p)} className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all"><Eye size={18}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === "historico" && (
        <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="p-8 border-b bg-slate-50"><h2 className="font-black text-xl italic tracking-tighter uppercase">Histórico de Consultas Concluídas</h2></div>
          <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b">
                  <tr><th className="p-6">Data</th><th className="p-6">Paciente</th><th className="p-6">Diagnóstico</th><th className="p-6 text-right">Relatório</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {historico.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6 text-xs font-mono">{new Date(h.data_consulta).toLocaleDateString()}</td>
                          <td className="p-6 font-bold">{h.nome_utente}</td>
                          <td className="p-6 text-slate-500 italic text-sm">{h.diagnostico.substring(0, 40)}...</td>
                          <td className="p-6 text-right"><button onClick={() => setRelatorioParaVer(h)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"><Eye size={20}/></button></td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      )}

      {abaAtiva === "consulta" && consultaAtiva && (
        <div className="bg-white rounded-[3rem] shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 text-white p-10 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="bg-white/10 p-5 rounded-3xl"><User size={40}/></div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter italic">{consultaAtiva.nome_utente}</h3>
                <div className="flex gap-2 mt-2">
                    <BadgePrioridade cor={consultaAtiva.cor_manchester}/>
                    <span className="text-[10px] uppercase font-black bg-white/10 px-2 py-1 rounded tracking-widest font-mono">ID: #{consultaAtiva.triagem_id}</span>
                </div>
              </div>
            </div>
            <div className="max-w-xs text-right">
                <p className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest">Queixa Principal (IA)</p>
                <p className="text-sm italic opacity-80 leading-relaxed font-medium">"{consultaAtiva.resumo_ia}"</p>
            </div>
          </div>
          <div className="p-10 grid grid-cols-1 gap-8">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-6 mb-3 block tracking-widest">Diagnóstico Clínico Profissional</label>
              <textarea className="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[2.5rem] h-32 outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner text-slate-700 font-medium" placeholder="Introduza o diagnóstico detalhado..." value={relatorio.diagnostico} onChange={e => setRelatorio({...relatorio, diagnostico: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-6 mb-3 block tracking-widest">Prescrição Médica & Dosagem</label>
              <textarea className="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[2.5rem] h-32 outline-none focus:border-green-600 focus:bg-white transition-all shadow-inner text-slate-700 font-medium" placeholder="Indique a medicação e as recomendações de tratamento..." value={relatorio.prescricao} onChange={e => setRelatorio({...relatorio, prescricao: e.target.value})} />
            </div>
            <button onClick={finalizarConsulta} className="w-full bg-green-600 text-white py-6 rounded-[2.5rem] font-black text-2xl hover:bg-slate-900 hover:shadow-2xl transition-all flex items-center justify-center gap-4 mt-2">
              <Send size={24}/> Finalizar Atendimento
            </button>
          </div>
        </div>
      )}

      {/* POPUP E MODAL */}
      {pacientePopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-lg relative text-center shadow-2xl"><button onClick={() => setPacientePopup(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X /></button><BadgePrioridade cor={pacientePopup.cor_manchester}/><h2 className="text-4xl font-black mt-8 mb-6">{pacientePopup.nome_utente}</h2><p className="bg-blue-50 p-6 rounded-[2rem] italic">"{pacientePopup.resumo_ia}"</p></div>
        </div>
      )}
      {relatorioParaVer && <ModalVisualizarRelatorio dados={relatorioParaVer} onClose={() => setRelatorioParaVer(null)} />}
    </div>
  );
}