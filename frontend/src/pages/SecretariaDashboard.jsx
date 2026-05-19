import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import { Search, CheckCircle, LayoutList, History, BarChart3 } from "lucide-react";

export default function SecretariaDashboard({ user }) {
  const navigate = useNavigate();
  const [fila, setFila] = useState([]);
  const [visaoGeral, setVisaoGeral] = useState([]);
  const [aba, setAba] = useState("checkin");
  const [busca, setBusca] = useState("");

  const carregarFilas = async () => {
    try {
      const hospitalId = user?.hospital_id ?? 1;
      
      const resSec = await api.get(`/secretaria/fila?hospital_id=${hospitalId}`);
      setFila(resSec.data || []);

      const resGeral = await api.get(`/medico/fila?hospital_id=${hospitalId}`);
      setVisaoGeral(resGeral.data || []);
    } catch (e) { 
      console.error("Erro ao carregar filas:", e); 
    }
  };

  useEffect(() => { 
    carregarFilas(); 
    const timer = setInterval(carregarFilas, 5000);
    return () => clearInterval(timer);
  }, [user]);

  const validarEntrada = async (nome) => {
    try {
      await api.post(`/checkin/nome/${nome}/chamar`);
      alert(`Entrada de ${nome} validada com sucesso!`);
      carregarFilas();
    } catch (e) { 
      alert("Erro ao validar. Confirme a conexão com o servidor."); 
    }
  };

  const listaCheckin = fila; 
  const listaGeral = visaoGeral.filter(p => p.estado_fila !== 'pendente' && p.estado_fila !== 'checkin_feito');
  
  const listaMostrada = aba === "checkin" ? listaCheckin : listaGeral;

  const formatarEstado = (estadoFila, estadoTriagem) => {
      const estado = estadoFila || estadoTriagem;
      switch(estado) {
          case 'pendente': return <span className="text-amber-500 font-bold bg-amber-50 px-3 py-1 rounded-full text-xs">A Aguardar Check-in</span>;
          case 'aguardar': return <span className="text-blue-500 font-bold bg-blue-50 px-3 py-1 rounded-full text-xs">Na Sala de Espera</span>;
          case 'chamado': 
          case 'em_consulta': return <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full text-xs">Em Consulta</span>;
          case 'concluido': return <span className="text-green-500 font-bold bg-green-50 px-3 py-1 rounded-full text-xs">Finalizado</span>;
          default: return <span className="text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full text-[10px] uppercase">{estado}</span>;
      }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-10">
      
      {/* MENU DE ABAS */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-2 rounded-3xl shadow-sm border">
        <button 
          onClick={() => setAba("checkin")} 
          className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${aba === "checkin" ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          <LayoutList size={20} /> <span className="hidden sm:inline">Admissão</span> ({listaCheckin.length})
        </button>
        <button 
          onClick={() => setAba("geral")} 
          className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${aba === "geral" ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          <History size={20} /> <span className="hidden sm:inline">Visão Geral do Hospital</span> ({listaGeral.length})
        </button>
        <button
          onClick={() => navigate('/estatisticas')}
          className="flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          <BarChart3 size={20} /> <span className="hidden sm:inline">Estatísticas</span>
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden animate-in fade-in duration-300">
        <div className="p-6 md:p-8 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-black text-xl italic tracking-tighter uppercase text-center md:text-left">
            {aba === "checkin" ? "Utentes para Validar" : "Estado da Sala de Espera"}
          </h3>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Pesquisar por nome..." 
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm" 
                onChange={e => setBusca(e.target.value.toLowerCase())} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b">
              <tr>
                  <th className="p-6 w-32">Prioridade</th>
                  <th className="p-6">Nome do Utente</th>
                  <th className="p-6 w-48 text-center">Estado Atual</th>
                  {aba === "checkin" && <th className="p-6 text-right w-48">Ação</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listaMostrada.filter(p => (p.nome_utente || p.nome || "").toLowerCase().includes(busca)).length > 0 ? (
                  listaMostrada.filter(p => (p.nome_utente || p.nome || "").toLowerCase().includes(busca)).map((p, i) => {
                    
                    const nomePaciente = p.nome_utente || p.nome || "Utente Desconhecido";

                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6"><BadgePrioridade cor={p.cor_manchester} /></td>
                          <td className="p-6 font-bold text-slate-700 text-lg">{nomePaciente}</td>
                          <td className="p-6 text-center">{formatarEstado(p.estado_fila, p.estado_triagem || p.estado)}</td>
                          
                          {aba === "checkin" && (
                          <td className="p-6 text-right">
                              <button 
                                  onClick={() => validarEntrada(nomePaciente)} 
                                  className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-green-600 transition-all shadow-md transform hover:-translate-y-0.5 whitespace-nowrap"
                              >
                                  <CheckCircle size={14} className="inline mr-2 mb-0.5"/>
                                  Validar Entrada
                              </button>
                          </td>
                          )}
                      </tr>
                    );
                  })
              ) : (
                  <tr>
                      <td colSpan={aba === "checkin" ? 4 : 3} className="p-16 text-center text-slate-400 font-medium italic">
                          <div className="border-dashed border-2 p-8 m-4 rounded-3xl">
                             {aba === "checkin" ? "Não há utentes a aguardar check-in no momento." : "A sala de espera e os gabinetes estão vazios."}
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}