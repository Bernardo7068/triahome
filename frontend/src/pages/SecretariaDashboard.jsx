import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import { Search, CheckCircle, LayoutList, History } from "lucide-react";

export default function SecretariaDashboard() {
  const [fila, setFila] = useState([]);
  const [visaoGeral, setVisaoGeral] = useState([]); // Guardamos a lista geral à parte
  const [aba, setAba] = useState("checkin");
  const [busca, setBusca] = useState("");

const carregarFilas = async () => {
    try {
      // Agora o 'user' já existe e o código abaixo vai funcionar
      const resSec = await api.get(`/secretaria/fila?hospital_id=${user.hospital_id}`);
      setFila(resSec.data || []);

      const resGeral = await api.get(`/medico/fila?hospital_id=${user.hospital_id}`);
      setVisaoGeral(resGeral.data || []);
    } catch (e) { 
      console.error("Erro ao carregar filas:", e); 
    }
  };

  // Carrega ao iniciar e a cada 5 segundos
  useEffect(() => { 
    carregarFilas(); 
    const timer = setInterval(carregarFilas, 5000);
    return () => clearInterval(timer);
  }, []);

  const validarEntrada = async (nome) => {
    try {
      await api.post(`/checkin/nome/${nome}/chamar`);
      alert(`Entrada de ${nome} validada com sucesso!`);
      carregarFilas();
    } catch (e) { 
      alert("Erro ao validar. Confirme a conexão com o servidor."); 
    }
  };

  // A aba 'Admissão' usa a nova Rota (só pendentes)
  const listaCheckin = fila; 
  // A aba 'Visão Geral' usa a rota do médico, mas tiramos os que ainda estão pendentes
  const listaGeral = visaoGeral.filter(p => p.estado_fila !== 'pendente' && p.estado_fila !== 'checkin_feito');
  
  const listaMostrada = aba === "checkin" ? listaCheckin : listaGeral;

  // Função auxiliar para traduzir os estados técnicos para português legível
  const formatarEstado = (estadoFila, estadoTriagem) => {
      const estado = estadoFila || estadoTriagem;
      switch(estado) {
          case 'pendente': return <span className="text-amber-500 font-bold bg-amber-50 px-3 py-1 rounded-full">A Aguardar Check-in</span>;
          case 'aguardar': return <span className="text-blue-500 font-bold bg-blue-50 px-3 py-1 rounded-full">Na Sala de Espera</span>;
          case 'chamado': 
          case 'em_consulta': return <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">Em Consulta Médica</span>;
          default: return <span className="text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full text-xs uppercase">{estado}</span>;
      }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* ABAS */}
      <div className="flex gap-4">
        <button 
          onClick={() => setAba("checkin")} 
          className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${aba === "checkin" ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border text-slate-400 hover:bg-slate-50'}`}
        >
          <LayoutList size={20} /> Admissão ({listaCheckin.length})
        </button>
        <button 
          onClick={() => setAba("geral")} 
          className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${aba === "geral" ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border text-slate-400 hover:bg-slate-50'}`}
        >
          <History size={20} /> Visão Geral do Hospital ({listaGeral.length})
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden animate-in fade-in duration-300">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-black text-xl italic tracking-tighter uppercase">{aba === "checkin" ? "Utentes para Validar (Check-in)" : "Estado da Sala de Espera / Gabinetes"}</h3>
          <div className="relative w-72">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Pesquisar por nome..." 
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                onChange={e => setBusca(e.target.value.toLowerCase())} 
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b">
            <tr>
                <th className="p-6 w-32">Prioridade</th>
                <th className="p-6">Nome do Utente</th>
                <th className="p-6 w-48">Estado Atual</th>
                {aba === "checkin" && <th className="p-6 text-right w-48">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listaMostrada.filter(p => p.nome_utente.toLowerCase().includes(busca)).length > 0 ? (
                listaMostrada.filter(p => p.nome_utente.toLowerCase().includes(busca)).map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                    <td className="p-6 font-bold text-slate-700 text-lg">{p.nome_utente}</td>
                    <td className="p-6 text-xs">{formatarEstado(p.estado_fila, p.estado_triagem || p.estado)}</td>
                    
                    {aba === "checkin" && (
                    <td className="p-6 text-right">
                        <button 
                            onClick={() => validarEntrada(p.nome_utente)} 
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-green-600 transition-all shadow-md transform hover:-translate-y-0.5"
                        >
                            <CheckCircle size={14} className="inline mr-2 mb-0.5"/>
                            Validar Entrada
                        </button>
                    </td>
                    )}
                </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={4} className="p-16 text-center text-slate-400 font-medium italic border-dashed border-2 m-4 rounded-3xl">
                        {aba === "checkin" ? "Não há utentes a aguardar check-in no momento." : "A sala de espera e os gabinetes estão vazios."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}