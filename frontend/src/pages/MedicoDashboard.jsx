import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import ModalRelatorio from "./RelatorioConsulta";
import { Stethoscope, Play, Send, User, Clock, Eye, X, History, AlertCircle, LayoutDashboard, Timer } from "lucide-react";

export default function MedicoDashboard({ user }) {
  const [fila, setFila] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("espera");
  const [consultaAtiva, setConsultaAtiva] = useState(null);
  const [pacientePopup, setPacientePopup] = useState(null);
  const [relatorio, setRelatorio] = useState({ diagnostico: "", prescricao: "", notas_clinicas: "" });
  const [relatorioParaVer, setRelatorioParaVer] = useState(null);
  
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarDados = async () => {
    try {
      const hospitalId = user?.hospital_id || 1; 
      const userId = user?.id || 1;

      const resFila = await api.get(`/medico/fila?hospital_id=${hospitalId}`);
      const dadosFila = resFila.data || [];
      setFila(dadosFila);
      
      const pacienteEmConsulta = dadosFila.find(p => p.estado_fila === 'em_consulta');
      if (pacienteEmConsulta) {
          setConsultaAtiva(pacienteEmConsulta);
          setAbaAtiva(prev => prev === 'espera' ? 'consulta' : prev);
      } else {
          setConsultaAtiva(null);
      }

      const resHist = await api.get(`/historico/${userId}/medico?hospital_id=${hospitalId}`);
      setHistorico(resHist.data || []);
    } catch (e) { 
      console.error("Erro ao carregar dados:", e); 
    }
  };

  useEffect(() => { 
      carregarDados(); 
  }, [user]);

  const chamarProximo = async () => {
    try {
      const hospitalId = user?.hospital_id || "";
      const res = await api.get(`/medico/proximo?hospital_id=${hospitalId}`);
      
      if (res.data && res.data.nome_utente) {
        setConsultaAtiva(res.data);
        setAbaAtiva("consulta"); 
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
        medico_id: user?.id || 1,
        utente_id: consultaAtiva.utente_id,
        diagnostico: relatorio.diagnostico,
        prescricao: relatorio.prescricao,
        notas_clinicas: relatorio.notas_clinicas
      });
      
      alert("Consulta finalizada!");
      setConsultaAtiva(null);
      setRelatorio({ diagnostico: "", prescricao: "", notas_clinicas: "" });
      setAbaAtiva("espera"); 
      carregarDados();
    } catch (e) { 
      alert("Erro ao finalizar consulta."); 
    }
  };

  const ModalVisualizarRelatorio = ({ dados, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900"><X /></button>
        <div className="p-12 font-mono text-sm text-slate-800">
          <div className="text-center border-b-2 border-dashed pb-8 mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Relatório Clínico</h2>
            <p className="font-bold text-blue-600">Serviço Nacional de Saúde</p>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div><p className="text-[10px] uppercase text-slate-400 font-bold">Paciente</p><p className="font-black text-lg">{dados.nome_utente}</p></div>
            <div><p className="text-[10px] uppercase text-slate-400 font-bold">Data</p><p className="font-black text-lg">{new Date(dados.data_consulta).toLocaleDateString()}</p></div>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8 space-y-6">
            <div><p className="text-[10px] font-black text-blue-600 mb-2 uppercase italic tracking-widest">Diagnóstico</p><p className="text-base font-medium leading-relaxed">"{dados.diagnostico}"</p></div>
            <div><p className="text-[10px] font-black text-green-600 mb-2 uppercase italic tracking-widest">Prescrição</p><p className="text-base font-medium leading-relaxed">"{dados.prescricao}"</p></div>
          </div>
          <div className="text-center opacity-40 text-[9px] uppercase mt-12"><p>Validado pelo Dr. {user?.nome}</p></div>
        </div>
        <div className="bg-slate-50 p-6 flex justify-center"><button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"><Printer size={18}/> Imprimir / PDF</button></div>
      </div>
    </div>
  );

  // Listas filtradas
  const listaEspera = fila.filter(p => p.estado_fila === 'aguardar');
  const listaGeral = fila;

  const formatarEstado = (estadoFila, estadoTriagem) => {
      if (!estadoFila || estadoTriagem === 'pendente' || estadoTriagem === 'checkin_feito') {
        return <span className="text-amber-500 font-bold bg-amber-50 px-3 py-1 rounded-full text-xs">Na Secretaria</span>;
      }
      switch(estadoFila) {
          case 'aguardar': return <span className="text-blue-500 font-bold bg-blue-50 px-3 py-1 rounded-full text-xs">Na Sala de Espera</span>;
          case 'em_consulta': return <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full text-xs">Em Consulta</span>;
          case 'concluido': return <span className="text-green-500 font-bold bg-green-50 px-3 py-1 rounded-full text-xs">Finalizado</span>;
          default: return <span className="text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full text-[10px] uppercase">{estadoFila}</span>;
      }
  };

  const listaEspera = fila.filter(p => p.estado_fila === 'aguardar');
  const listaGeral = fila;

  return (
    <div className="space-y-6">
      {/* MENU */}
      <div className="flex gap-4 mb-6 bg-white p-2 rounded-3xl shadow-sm border">
        <button onClick={() => setAbaAtiva("espera")} className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'espera' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
          <Clock size={20}/> Sala de Espera ({listaEspera.length})
        </button>
        <button onClick={() => setAbaAtiva("geral")} className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'geral' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
          <LayoutDashboard size={20}/> Visão Geral ({listaGeral.length})
        </button>
        <button onClick={() => setAbaAtiva("historico")} className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'historico' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
          <History size={20}/> Atendimentos ({historico.length})
        </button>
        {consultaAtiva && (
          <button onClick={() => setAbaAtiva("consulta")} className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'consulta' ? 'bg-red-500 text-white shadow-lg' : 'bg-red-50 text-red-500 border border-red-200'}`}>
            <AlertCircle size={20} className={abaAtiva !== 'consulta' ? "animate-pulse" : ""}/> Em Consulta
          </button>
        )}
      </div>

      {/* SALA DE ESPERA */}
      {abaAtiva === "espera" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] border flex justify-between items-center shadow-sm">
            <h2 className="text-2xl font-black flex items-center gap-2 tracking-tighter"><Stethoscope className="text-blue-600"/> Próximos Pacientes</h2>
            <button onClick={chamarProximo} disabled={listaEspera.length === 0 || consultaAtiva} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center gap-2">
              <Play fill="currentColor" size={18}/> Chamar Próximo
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr>
                  <th className="p-6">Prioridade</th>
                  <th className="p-6">Utente</th>
                  <th className="p-6">Tempo Espera</th>
                  <th className="p-6 text-right">Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaEspera.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                    <td className="p-6 font-bold text-slate-700">{p.nome_utente}</td>
                    <td className="p-6 font-mono text-sm text-slate-500 flex items-center gap-2 mt-2">
                        <Timer size={16} className="text-slate-400" /> 
                        {calcularTempoEspera(p.hora_entrada)}
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={() => setPacientePopup(p)} className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Eye size={20}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {listaEspera.length === 0 && (
                  <tr><td colSpan={4} className="p-16 text-center text-slate-400 font-medium italic">A sala de espera está vazia.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISÃO GERAL */}
      {abaAtiva === "geral" && (
        <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="p-8 border-b bg-slate-50">
              <h2 className="font-black text-xl italic tracking-tighter uppercase text-slate-800">Estado Global do Hospital</h2>
          </div>
          <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b">
                  <tr>
                    <th className="p-6">Prioridade</th>
                    <th className="p-6">Paciente</th>
                    <th className="p-6">Tempo Espera</th>
                    <th className="p-6 text-center">Diagnóstico</th>
                    <th className="p-6 text-right">Estado Atual</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {listaGeral.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                          <td className="p-6 font-bold text-slate-700">{p.nome_utente}</td>
                          <td className="p-6 font-mono text-xs text-slate-500">{calcularTempoEspera(p.hora_entrada)}</td>
                          <td className="p-6 text-center">
                              <button onClick={() => setPacientePopup(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg">
                                  <Eye size={16}/>
                              </button>
                          </td>
                          <td className="p-6 text-right">{formatarEstado(p.estado_fila, p.estado_triagem)}</td>
                      </tr>
                  ))}
                  {listaGeral.length === 0 && (
                      <tr><td colSpan={5} className="p-16 text-center text-slate-400 font-medium italic border-dashed border-2 m-4 rounded-3xl">Não há movimento no hospital.</td></tr>
                  )}
              </tbody>
          </table>
        </div>
      )}

      {/* HISTÓRICO */}
      {abaAtiva === "historico" && (
        <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="p-8 border-b bg-slate-50"><h2 className="font-black text-xl italic tracking-tighter uppercase">Histórico</h2></div>
          <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b">
                <tr><th className="p-6">Data</th><th className="p-6">Paciente</th><th className="p-6 text-right">Ver Relatório</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {historico.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6 text-xs font-mono">{new Date(h.data_consulta).toLocaleDateString()}</td>
                          <td className="p-6 font-bold">{h.nome_utente}</td>
                          <td className="p-6 text-right"><button onClick={() => setRelatorioParaVer(h)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"><Eye size={20}/></button></td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      )}

      {/* CONSULTA ATIVA */}
      {abaAtiva === "consulta" && consultaAtiva && (
        <div className="bg-white rounded-[3rem] shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 text-white p-10 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="bg-white/10 p-5 rounded-3xl"><User size={40}/></div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter italic">{consultaAtiva.nome_utente}</h3>
                <div className="flex gap-2 mt-2">
                    <BadgePrioridade cor={consultaAtiva.cor_manchester}/>
                </div>
              </div>
            </div>
            <div className="max-w-xs text-right">
                <p className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest">Queixa Principal</p>
                <p className="text-sm italic opacity-80 leading-relaxed font-medium">"{consultaAtiva.resumo_ia}"</p>
            </div>
          </div>
          <div className="p-10 space-y-8">
            <textarea className="w-full p-8 bg-slate-50 border-2 rounded-[2.5rem] h-32 outline-none focus:border-blue-600" placeholder="Diagnóstico..." value={relatorio.diagnostico} onChange={e => setRelatorio({...relatorio, diagnostico: e.target.value})} />
            <textarea className="w-full p-8 bg-slate-50 border-2 rounded-[2.5rem] h-32 outline-none focus:border-green-600" placeholder="Prescrição..." value={relatorio.prescricao} onChange={e => setRelatorio({...relatorio, prescricao: e.target.value})} />
            <button onClick={finalizarConsulta} className="w-full bg-green-600 text-white py-6 rounded-[2.5rem] font-black text-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4">
              <Send size={24}/> Finalizar Atendimento
            </button>
          </div>
        </div>
      )}

      {/* POPUP DE PRÉ-DIAGNÓSTICO DA IA (Este fica interno porque é só para mostrar os sintomas na fila) */}
      {pacientePopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-lg relative text-center shadow-2xl">
            <button onClick={() => setPacientePopup(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X /></button>
            <BadgePrioridade cor={pacientePopup.cor_manchester}/>
            <h2 className="text-4xl font-black mt-8 mb-6">{pacientePopup.nome_utente}</h2>
            <p className="bg-blue-50 p-6 rounded-[2rem] italic">"{pacientePopup.resumo_ia}"</p>
          </div>
        </div>
      )}

      {/* AQUI ESTÁ O NOVO COMPONENTE EXTERNO PARA O RELATÓRIO DO HISTÓRICO! */}
      {relatorioParaVer && <ModalRelatorio dados={relatorioParaVer} onClose={() => setRelatorioParaVer(null)} />}
    </div>
  );
}