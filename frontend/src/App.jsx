import { useState, useEffect } from "react";
import api from "./services/api";
import { 
  Search, User as UserIcon, Activity, Clock, LogOut, 
  CheckCircle, AlertCircle, ChevronRight, Stethoscope, Shield 
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("dashboard"); // dashboard, fila, historico
  const [step, setStep] = useState(1);
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  const [fila, setFila] = useState([]);
  const [hospitais, setHospitais] = useState([]);
  const [selectedTriagem, setSelectedTriagem] = useState(null); // Para o Modal do Médico
  const [busca, setBusca] = useState("");

  // Dados do formulário do utente
  const [formData, setFormData] = useState({ idade: "", sintomas: "", sinais: [] });

  // Carregar dados iniciais conforme o perfil
  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 15000); // Polling a cada 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      if (user.role === 'medico' || user.role === 'secretaria') {
        const resFila = await api.get('/medico/fila');
        setFila(resFila.data);
      }
      if (user.role === 'admin' || user.role === 'secretaria') {
        const resHosp = await api.get('/hospitais/lotacao');
        setHospitais(resHosp.data);
      }
    } catch (err) { console.error("Erro na conexão"); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/login', { email: loginData.user, password: loginData.pass });
      setUser(res.data.user);
    } catch (err) { alert("Credenciais incorretas."); }
    finally { setLoading(false); }
  };

  const handleEnviarTriagem = async () => {
    setLoading(true);
    try {
      await api.post('/triagens', {
        utente_id: user.id,
        hospital_id: 1,
        sintomas: formData.sintomas
      });
      alert("IA processou a sua triagem com sucesso!");
      setStep(1); setView("historico");
    } catch (err) { alert("Erro ao contactar a IA."); }
    finally { setLoading(false); }
  };

  // --- VISTAS PARCIAIS ---

  const Header = () => (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-xl text-white"><Activity size={20} /></div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">TRIA<span className="text-blue-600">HOME</span></h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-slate-800 leading-none">{user.nome}</p>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{user.role}</p>
        </div>
        <button onClick={() => setUser(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-600"><Stethoscope size={120} /></div>
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter italic">TRIA-Home</h1>
            <p className="text-slate-400 font-medium">Gestão Inteligente de Urgências</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="group">
              <input type="text" placeholder="Email institucional" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none group-focus-within:border-blue-500 transition-all" 
                onChange={e => setLoginData({...loginData, user: e.target.value})} />
            </div>
            <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all"
              onChange={e => setLoginData({...loginData, pass: e.target.value})} />
            <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-blue-100">
              {loading ? "A autenticar..." : "Entrar no Portal"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* DASHBOARD ADMIN / SECRETARIA: LOTAÇÃO */}
        {(user.role === 'admin' || user.role === 'secretaria') && (
          <section className="mb-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Shield size={14} /> Monitorização Global de Unidades
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hospitais.map(h => (
                <div key={h.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800">{h.nome}</h4>
                      <p className="text-xs text-slate-400">{h.cidade}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${h.pct_ocupacao > 80 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {h.pct_ocupacao}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${h.pct_ocupacao > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${h.pct_ocupacao}%`}}></div>
                  </div>
                  <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ocupação: {h.lotacao_atual} / {h.capacidade_urgencia} Camas</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VISTA UTENTE: WORKFLOW */}
        {user.role === 'utente' && (
          <div className="max-w-2xl mx-auto py-10">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-12 text-center">
              {step === 1 ? (
                <>
                  <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-inner">
                    <AlertCircle size={40} />
                  </div>
                  <h2 className="text-3xl font-black mb-4 tracking-tighter">Como se sente agora?</h2>
                  <p className="text-slate-500 mb-8 font-medium italic">O nosso sistema de IA vai analisar os seus sintomas para determinar a prioridade de atendimento.</p>
                  <textarea 
                    className="w-full h-40 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-blue-500 transition-all mb-6 text-lg"
                    placeholder="Descreva aqui o que sente (ex: dor no peito, falta de ar...)"
                    onChange={(e) => setFormData({...formData, sintomas: e.target.value})}
                  />
                  <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                    Continuar para Avaliação
                  </button>
                </>
              ) : (
                <div className="animate-in fade-in zoom-in duration-500">
                  <h3 className="text-2xl font-black mb-6">Confirmar Submissão?</h3>
                  <div className="bg-slate-50 p-6 rounded-3xl text-left text-slate-600 italic mb-8 border-l-4 border-blue-500">
                    "{formData.sintomas}"
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 p-5 rounded-[2rem] font-bold text-slate-400">Voltar</button>
                    <button onClick={handleEnviarTriagem} className="flex-1 bg-green-600 text-white p-5 rounded-[2rem] font-bold shadow-lg shadow-green-100 hover:scale-105 transition-all">
                      {loading ? "A Processar IA..." : "Enviar para Triagem"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA MÉDICO / SECRETARIA: LISTA INTERATIVA */}
        {(user.role === 'medico' || user.role === 'secretaria') && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
              <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter">
                <Clock className="text-blue-600" /> Fila de Espera Dinâmica
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Procurar utente ou cor..." 
                  className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80 shadow-sm"
                  onChange={(e) => setBusca(e.target.value.toLowerCase())}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                  <tr>
                    <th className="p-6">Prioridade</th>
                    <th className="p-6">Utente</th>
                    <th className="p-6">Tempo Espera</th>
                    <th className="p-6">Estado</th>
                    <th className="p-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fila.filter(p => p.nome_utente.toLowerCase().includes(busca) || p.cor_manchester.includes(busca)).map((p, idx) => (
                    <tr key={idx} className={`group hover:bg-slate-50 transition-all cursor-pointer ${p.cor_manchester === 'vermelho' ? 'bg-red-50/30' : ''}`}>
                      <td className="p-6">
                        <div className={`w-3 h-12 rounded-full mx-auto ${
                          p.cor_manchester === 'vermelho' ? 'bg-red-600 shadow-lg shadow-red-200' :
                          p.cor_manchester === 'laranja' ? 'bg-orange-500' :
                          p.cor_manchester === 'amarelo' ? 'bg-yellow-400' : 'bg-green-500'
                        }`}></div>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-slate-800 text-lg tracking-tight">{p.nome_utente}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase">{p.data_nascimento}</p>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 font-mono font-bold text-slate-500">
                          <Clock size={14} /> {p.tempo_espera_min} min
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-400 italic">
                          <div className={`w-2 h-2 rounded-full ${p.estado_fila === 'chamado' ? 'bg-blue-600 animate-ping' : 'bg-slate-300'}`}></div>
                          {p.estado_fila}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => setSelectedTriagem(p)}
                          className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL DE DETALHES CLÍNICOS (MÉDICO) */}
        {selectedTriagem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
              <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                {/* Lateral Esquerda: Info Paciente */}
                <div className="bg-slate-50 p-10 border-r">
                  <div className={`w-16 h-16 rounded-3xl mb-6 flex items-center justify-center text-white ${
                    selectedTriagem.cor_manchester === 'vermelho' ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    <UserIcon size={30} />
                  </div>
                  <h2 className="text-2xl font-black mb-2 tracking-tight">{selectedTriagem.nome_utente}</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase mb-8">SNS: {selectedTriagem.id}</p>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Prioridade Sugerida</p>
                      <p className="font-bold text-lg uppercase tracking-tight">{selectedTriagem.cor_manchester}</p>
                    </div>
                  </div>
                </div>

                {/* Lateral Direita: Notas e IA */}
                <div className="col-span-2 p-12 overflow-y-auto max-h-[80vh]">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black tracking-tight">Análise Clínica IA</h3>
                    <button onClick={() => setSelectedTriagem(null)} className="text-slate-300 hover:text-slate-800 font-black">X</button>
                  </div>
                  
                  <div className="bg-blue-50/50 p-8 rounded-[2rem] border-2 border-dashed border-blue-200 text-blue-900 italic leading-relaxed mb-8 relative">
                    <span className="absolute top-4 right-4 text-[10px] font-black bg-blue-100 px-2 py-1 rounded">LLAMA-3 ENGINE</span>
                    "{selectedTriagem.resumo_ia}"
                  </div>

                  <div className="space-y-6">
                    <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest">Ações Clínicas</h4>
                    <textarea placeholder="Adicionar observações médicas..." className="w-full h-32 p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" />
                    <div className="flex gap-4">
                      <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all">Validar Triagem</button>
                      <button className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all">Prioridade Crítica</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}