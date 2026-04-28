import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import { Search, CheckCircle, LayoutList, History } from "lucide-react";

export default function SecretariaDashboard() {
  const [fila, setFila] = useState([]);
  const [aba, setAba] = useState("checkin");
  const [busca, setBusca] = useState("");

  const carregarFila = async () => {
    try {
      const res = await api.get('/medico/fila');
      setFila(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { carregarFila(); }, []);

  const validarEntrada = async (nome) => {
    try {
      await api.post(`/checkin/nome/${nome}/chamar`);
      alert("Entrada Validada!");
      carregarFila();
    } catch (e) { alert("Erro ao validar."); }
  };

  const listaCheckin = fila.filter(p => p.estado_triagem === 'pendente' || p.estado_triagem === 'checkin_feito');
  const listaGeral = fila.filter(p => p.estado_triagem !== 'pendente' && p.estado_triagem !== 'checkin_feito');
  const listaMostrada = aba === "checkin" ? listaCheckin : listaGeral;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button onClick={() => setAba("checkin")} className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${aba === "checkin" ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
          <LayoutList size={18} /> Admissão ({listaCheckin.length})
        </button>
        <button onClick={() => setAba("geral")} className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${aba === "geral" ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
          <History size={18} /> Visão Geral ({listaGeral.length})
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-black text-xl italic">{aba === "checkin" ? "Utentes para Validar" : "Registo Geral"}</h3>
          <div className="relative w-64">
            <Search className="absolute left-4 top-3 text-slate-300" size={16} />
            <input type="text" placeholder="Pesquisar..." className="w-full pl-10 pr-4 py-2 border rounded-xl" onChange={e => setBusca(e.target.value.toLowerCase())} />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b">
            <tr><th className="p-6">Prioridade</th><th className="p-6">Utente</th><th className="p-6">Estado</th>{aba === "checkin" && <th className="p-6 text-right">Ação</th>}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listaMostrada.filter(p => p.nome_utente.toLowerCase().includes(busca)).map((p, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                <td className="p-6 font-bold">{p.nome_utente}</td>
                <td className="p-6"><span className="text-xs font-bold uppercase text-slate-400">{p.estado_fila || p.estado_triagem}</span></td>
                {aba === "checkin" && (
                  <td className="p-6 text-right">
                    <button onClick={() => validarEntrada(p.nome_utente)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-all">Validar Entrada</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}