import { useState, useEffect } from "react";
import api from "./services/api"; // Instância do Axios configurada para a API Laravel

export default function App() {
  const [user, setUser] = useState(null); 
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  const [fila, setFila] = useState([]); // Dados reais da BD

  // Estado do formulário do utente
  const [utenteData, setUtenteData] = useState({
    nome: "", sns: "", telemovel: "", idade: "", genero: "M",
    sinais: [], sintomas: ""
  });

  // Carregar dados automaticamente se for Médico ou Secretaria
  useEffect(() => {
    if (user && (user.role === 'medico' || user.role === 'secretaria')) {
      const fetchFila = async () => {
        try {
          const res = await api.get('/medico/fila');
          setFila(res.data);
        } catch (err) { console.error("Erro ao carregar fila", err); }
      };
      fetchFila();
      const interval = setInterval(fetchFila, 10000); // Atualiza a cada 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  // Função de Login Real
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/login', {
        email: loginData.user,
        password: loginData.pass
      });
      setUser(response.data.user);
    } catch (error) {
      alert("Falha no login: Verifica as credenciais na base de dados.");
    } finally { setLoading(false); }
  };

  // Submeter Triagem para a API (que chama o Ollama)
  const handleFinalizarTriagem = async () => {
    setLoading(true);
    try {
      const res = await api.post('/triagens', {
        utente_id: user.id,
        hospital_id: 1,
        sintomas: utenteData.sintomas,
        sinais: utenteData.sinais
      });
      alert(`Triagem Concluída! Prioridade: ${res.data.cor_manchester.toUpperCase()}`);
      setUser(null); // Reset após envio ou redirecionar
    } catch (err) { alert("Erro ao contactar a IA."); }
    finally { setLoading(false); }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-200">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-blue-600 italic tracking-tighter">TRIA-Home</h1>
            <p className="text-slate-400 font-medium">Portal Hospitalar Inteligente</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Email (ana@tria.pt)" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={e => setLoginData({...loginData, user: e.target.value})} />
            <input type="password" placeholder="Password (123456)" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setLoginData({...loginData, pass: e.target.value})} />
            <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50">
              {loading ? "A verificar..." : "Entrar no Sistema"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <h2 className="text-2xl font-black text-blue-600 italic">TRIA</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">
            {user.role}: {user.nome}
          </span>
          <button onClick={() => setUser(null)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">Sair</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* VISTA UTENTE */}
        {user.role === "utente" && (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between mb-12">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 flex-1 rounded-full mx-1 transition-all ${step >= i ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 relative overflow-hidden">
              {loading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 font-bold text-blue-600">A processar com IA...</div>}
              
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">1. Dados Pessoais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={user.nome} disabled className="col-span-2 p-4 border rounded-2xl bg-slate-100 cursor-not-allowed" />
                    <input type="text" value={user.nr_utente} disabled className="p-4 border rounded-2xl bg-slate-100" />
                    <input type="number" placeholder="Idade" className="p-4 border rounded-2xl bg-slate-50" onChange={e => setUtenteData({...utenteData, idade: e.target.value})} />
                  </div>
                  <button onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700">Próximo</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">2. Sinais Críticos</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {['Febre Alta', 'Dor no Peito', 'Dificuldade Respiratória', 'Desmaio'].map(sinal => (
                      <label key={sinal} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <span className="font-medium">{sinal}</span>
                        <input type="checkbox" className="w-6 h-6 accent-blue-600" />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 p-4 border rounded-2xl font-bold">Voltar</button>
                    <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-bold">Próximo</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">3. Descrição dos Sintomas</h3>
                  <textarea 
                    onChange={e => setUtenteData({...utenteData, sintomas: e.target.value})}
                    placeholder="Explique o que sente detalhadamente para a IA analisar..." 
                    className="w-full h-48 p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <button onClick={handleFinalizarTriagem} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100">Finalizar Triagem</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA SECRETARIA / MÉDICO (TABELA REAL) */}
        {(user.role === "secretaria" || user.role === "medico") && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-xl">Fila de Espera Clínica (Tempo Real)</h3>
              <button onClick={() => window.location.reload()} className="text-xs bg-white border px-3 py-1 rounded-lg font-bold">Atualizar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-6">Pos</th>
                    <th className="p-6">Utente</th>
                    <th className="p-6">Prioridade</th>
                    <th className="p-6">Estado</th>
                    <th className="p-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fila.map((p, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-6 font-black text-blue-600">{p.posicao}º</td>
                      <td className="p-6">
                        <p className="font-bold">{p.nome_utente}</p>
                        <p className="text-[10px] text-slate-400">ID: {p.utente_id}</p>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 
                          ${p.cor_manchester === 'vermelho' ? 'bg-red-50 border-red-200 text-red-600' : 
                            p.cor_manchester === 'laranja' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                            p.cor_manchester === 'amarelo' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 
                            'bg-green-50 border-green-200 text-green-600'}`}>
                          {p.cor_manchester}
                        </span>
                      </td>
                      <td className="p-6 text-sm text-slate-500 font-medium italic">{p.estado_fila}</td>
                      <td className="p-6 text-right">
                        <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all">
                          {user.role === 'medico' ? 'Atender' : 'Check-in'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}