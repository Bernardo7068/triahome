import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import { Stethoscope, Play, Send, User, Clock, Eye, X } from "lucide-react";

export default function MedicoDashboard({ user }) {
  const [fila, setFila] = useState([]);
  const [consultaAtiva, setConsultaAtiva] = useState(null);
  const [pacientePopup, setPacientePopup] = useState(null);
  const [relatorio, setRelatorio] = useState({ diagnostico: "", prescricao: "" });

  const carregarFila = async () => {
    try {
      const res = await api.get('/medico/fila');
      setFila(res.data);
      // Resgata consulta se houver alguém 'chamado' ou 'em_consulta'
      const emCurso = res.data.find(p => p.estado_fila === 'chamado' || p.estado_fila === 'em_consulta');
      if (emCurso) setConsultaAtiva(emCurso);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { carregarFila(); }, []);

  const chamarProximo = async () => {
    try {
      const res = await api.get('/medico/proximo');
      if (res.data && res.data.nome_utente) {
        setConsultaAtiva(res.data);
        carregarFila();
      } else { alert("Nenhum paciente validado na sala de espera."); }
    } catch (e) { alert("Erro ao chamar."); }
  };

  const finalizarConsulta = async () => {
    try {
      await api.post(`/consultas/finalizar`, {
        triagem_id: consultaAtiva.triagem_id,
        medico_id: user.id,
        utente_id: consultaAtiva.utente_id,
        ...relatorio
      });
      alert("Consulta Concluída!");
      setConsultaAtiva(null);
      carregarFila();
    } catch (e) { alert("Erro ao finalizar."); }
  };

  const listaEspera = fila.filter(p => p.estado_fila === 'aguardar');

  return (
    <div className="space-y-6">
      {!consultaAtiva ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border flex justify-between items-center">
            <h2 className="text-2xl font-black flex items-center gap-2"><Stethoscope className="text-blue-600"/> Sala de Espera</h2>
            <button onClick={chamarProximo} disabled={listaEspera.length === 0} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center gap-2">
              <Play fill="currentColor" size={18}/> Chamar Próximo Automático
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                <tr><th className="p-6">Prioridade</th><th className="p-6">Utente</th><th className="p-6">Espera</th><th className="p-6 text-right">Ação</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaEspera.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                    <td className="p-6 font-bold">{p.nome_utente}</td>
                    <td className="p-6 text-slate-400 font-mono text-xs"><Clock size={12} className="inline mr-1"/>{p.tempo_espera_min}m</td>
                    <td className="p-6 text-right"><button onClick={() => setPacientePopup(p)} className="text-blue-600 font-bold text-xs hover:underline">Espreitar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MODO CONSULTA */
        <div className="bg-white rounded-[3rem] shadow-2xl border overflow-hidden">
          <div className="bg-slate-900 text-white p-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-4 rounded-2xl"><User size={32}/></div>
              <div><h3 className="text-3xl font-black">{consultaAtiva.nome_utente}</h3><BadgePrioridade cor={consultaAtiva.cor_manchester}/></div>
            </div>
            <div className="text-sm bg-white/5 p-4 rounded-xl border border-white/10 italic">"{consultaAtiva.resumo_ia}"</div>
          </div>
          <div className="p-10 space-y-6">
            <textarea className="w-full p-6 bg-slate-50 border rounded-2xl h-32 outline-none focus:border-blue-600" placeholder="Diagnóstico Clínico..." onChange={e => setRelatorio({...relatorio, diagnostico: e.target.value})} />
            <textarea className="w-full p-6 bg-slate-50 border rounded-2xl h-32 outline-none focus:border-blue-600" placeholder="Medicação / Prescrição..." onChange={e => setRelatorio({...relatorio, prescricao: e.target.value})} />
            <button onClick={finalizarConsulta} className="w-full bg-green-600 text-white py-5 rounded-3xl font-black text-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"><Send /> Finalizar e Gerar Relatório</button>
          </div>
        </div>
      )}
      {pacientePopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-lg relative text-center">
            <button onClick={() => setPacientePopup(null)} className="absolute top-6 right-6 text-slate-300"><X /></button>
            <BadgePrioridade cor={pacientePopup.cor_manchester}/>
            <h2 className="text-3xl font-black mt-4 mb-4">{pacientePopup.nome_utente}</h2>
            <p className="bg-blue-50 p-6 rounded-3xl italic text-blue-900">"{pacientePopup.resumo_ia}"</p>
          </div>
        </div>
      )}
    </div>
  );
}