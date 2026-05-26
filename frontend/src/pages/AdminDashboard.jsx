import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Users, Building, PlusCircle, UserPlus, Stethoscope, Briefcase, Mail, Lock, FileText, Edit2, X, Save, ShieldAlert, BarChart3, Search } from "lucide-react";

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [hospitais, setHospitais] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("medicos");
  const [filtro, setFiltro] = useState("");
  
  // Estado do formulário de criação
  const [form, setForm] = useState({
    nome: "", email: "", password: "", role: "medico", hospital_id: "", nr_funcionario: "", especialidade: ""
  });

  // ESTADOS PARA EDIÇÃO DE UTILIZADORES
  const [userEmEdicao, setUserEmEdicao] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});

  const especialidades = [
    "Clínica Geral", "Pediatria", "Cardiologia", "Ortopedia", "Neurologia", 
    "Psiquiatria", "Ginecologia", "Dermatologia", "Oftalmologia", "Outra"
  ];

  const fetchDados = async () => {
    try {
      const resHospitais = await api.get('/admin/hospitais');
      const dadosHospitais = resHospitais.data || [];
      setHospitais(dadosHospitais);
      
      // Inicializa o hospital_id se houver hospitais disponíveis e o form ainda não tiver um
      if (dadosHospitais.length > 0 && !form.hospital_id) {
        setForm(prev => ({ ...prev, hospital_id: String(dadosHospitais[0].id) }));
      }

      const resUsers = await api.get('/admin/utilizadores');
      setUtilizadores(resUsers.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados do admin", error);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleCriarStaff = async (e) => {
    e.preventDefault();
    if (!form.hospital_id) {
      alert("Por favor, selecione um hospital.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/admin/utilizadores/novo", form);
      alert("Utilizador adicionado com sucesso!");
      // Limpa quase tudo mas mantém o hospital selecionado para facilitar
      setForm(prev => ({ ...prev, nome: "", email: "", password: "", nr_funcionario: "", especialidade: "" }));
      fetchDados();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao criar utilizador.");
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicao = (u) => {
    setUserEmEdicao(u);
    setFormEdicao({
      nome: u.nome || "",
      email: u.email || "",
      role: u.role || "utente",
      hospital_id: u.hospital_id || "",
      nr_funcionario: u.nr_funcionario || "",
      especialidade: u.especialidade || "",
      nr_utente: u.nr_utente || "",
      idade: u.idade || "",
      altura: u.altura || "",
      morada: u.morada || "",
      descricao: u.descricao || "",
      password: ""
    });
  };

  const handleGravarEdicao = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/utilizadores/editar/${userEmEdicao.id}`, formEdicao);
      alert("Utilizador atualizado com sucesso!");
      setUserEmEdicao(null);
      fetchDados();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao atualizar dados.");
    }
  };

  // Listas filtradas por aba e pesquisa
  const utilizadoresFiltrados = useMemo(() => {
    return utilizadores.filter(u => {
      const roleAlvo = abaAtiva === "medicos" ? "medico" : abaAtiva === "secretaria" ? "secretaria" : "utente";
      const matchesRole = u.role === roleAlvo;
      const matchesSearch = u.nome.toLowerCase().includes(filtro.toLowerCase()) || 
                            u.email.toLowerCase().includes(filtro.toLowerCase()) ||
                            (u.nr_utente && u.nr_utente.includes(filtro)) ||
                            (u.nr_funcionario && u.nr_funcionario.toLowerCase().includes(filtro.toLowerCase()));
      return matchesRole && matchesSearch;
    });
  }, [utilizadores, abaAtiva, filtro]);

  const counts = useMemo(() => ({
    medicos: utilizadores.filter(u => u.role === 'medico').length,
    secretaria: utilizadores.filter(u => u.role === 'secretaria').length,
    utentes: utilizadores.filter(u => u.role === 'utente').length,
  }), [utilizadores]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8 pb-20 text-left">
      
      {/* CABEÇALHO COM BOTÃO DE ESTATÍSTICAS */}
      <div className="pt-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Administração Global</h1>
          <p className="text-slate-500 font-medium text-lg mt-1 tracking-tight">Gestão centralizada de rede hospitalar e equipas clínicas.</p>
        </div>
        <button 
          onClick={() => navigate('/estatisticas')}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-200"
        >
          <BarChart3 size={20} /> Ver Estatísticas Clínicas
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO DE CRIAÇÃO (xl:col-span-4) */}
        <div className="xl:col-span-4 space-y-6 text-left">
          <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg shadow-slate-200"><UserPlus size={28} /></div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-slate-900">Novo Utilizador</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Registo de Staff / Utente</p>
              </div>
            </div>

            <form onSubmit={handleCriarStaff} className="space-y-5 text-left">
              <div>
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Cargo / Nível de Acesso</label>
                <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 text-sm outline-none focus:border-blue-500 transition-all" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="medico">👨‍⚕️ Médico(a)</option>
                  <option value="secretaria">👩‍💻 Secretaria / Triagem</option>
                  <option value="utente">👤 Utente / Paciente</option>
                  <option value="admin">🔑 Administrador Geral</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Hospital Alocado</label>
                <select required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})}>
                  {hospitais.map(h => (<option key={h.id} value={h.id}>{h.nome}</option>))}
                </select>
              </div>

              <div className="space-y-4 text-left">
                <input required type="text" placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                <input required type="email" placeholder="E-mail de Acesso" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <input required type="password" placeholder="Palavra-passe Inicial" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                
                {form.role !== 'admin' && form.role !== 'utente' && (
                  <input required type="text" placeholder="Nº de Funcionário (SEC001 / MED001)" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-mono font-black outline-none focus:border-blue-500 transition-all" value={form.nr_funcionario} onChange={e => setForm({...form, nr_funcionario: e.target.value})} />
                )}
              </div>

              {form.role === 'medico' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Especialidade Médica</label>
                  <select required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})}>
                    <option value="">Selecione Especialidade...</option>
                    {especialidades.map(esp => (<option key={esp} value={esp}>{esp}</option>))}
                  </select>
                </div>
              )}

              <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50 shadow-xl shadow-slate-100">
                Adicionar à Rede <PlusCircle size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* COLUNA DIREITA: GESTÃO DE LISTAS (xl:col-span-8) */}
        <div className="xl:col-span-8 space-y-6 text-left">
          
          {/* MENU DE ABAS E PESQUISA */}
          <div className="bg-white p-3 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex flex-1 w-full gap-2">
              <button onClick={() => setAbaAtiva("medicos")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${abaAtiva === 'medicos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Stethoscope size={18} /> Médicos ({counts.medicos})
              </button>
              <button onClick={() => setAbaAtiva("secretaria")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${abaAtiva === 'secretaria' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Briefcase size={18} /> Secretaria ({counts.secretaria})
              </button>
              <button onClick={() => setAbaAtiva("utentes")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${abaAtiva === 'utentes' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Users size={18} /> Utentes ({counts.utentes})
              </button>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar utilizador..." 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all"
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
              />
            </div>
          </div>

          {/* LISTAGEM */}
          <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="p-8">Identificação</th>
                    <th className="p-8">Afiliação / Hospital</th>
                    <th className="p-8">Detalhes</th>
                    <th className="p-8 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {utilizadoresFiltrados.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                            u.role === 'medico' ? 'bg-blue-50 text-blue-600' :
                            u.role === 'secretaria' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base">{u.nome}</p>
                            <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl w-fit">
                          <Building size={12} /> {u.hospital_nome || "Sem Hospital"}
                        </div>
                      </td>
                      <td className="p-8">
                        {u.role === 'medico' && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Especialidade</span>
                            <span className="font-bold text-slate-700">{u.especialidade || "---"}</span>
                          </div>
                        )}
                        {u.role === 'utente' && (
                          <div className="flex gap-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Idade</span>
                              <span className="font-bold text-slate-700">{u.idade || "--"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nº Utente</span>
                              <span className="font-mono font-bold text-slate-700">{u.nr_utente || "---"}</span>
                            </div>
                          </div>
                        )}
                        {u.role === 'secretaria' && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">ID Staff</span>
                            <span className="font-mono font-bold text-slate-700">{u.nr_funcionario || "---"}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-8 text-right">
                        <button 
                          onClick={() => iniciarEdicao(u)} 
                          className="p-4 bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm group-hover:scale-110"
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {utilizadoresFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <Users size={64} className="opacity-20" />
                          <p className="font-black uppercase tracking-[0.2em] text-sm">Nenhum utilizador encontrado nesta categoria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE EDIÇÃO */}
      {userEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-12 rounded-[4rem] w-full max-w-2xl relative shadow-2xl max-h-[90vh] overflow-y-auto text-left animate-in zoom-in-95 duration-200">
            <button onClick={() => setUserEmEdicao(null)} className="fixed md:absolute top-8 right-8 text-slate-400 hover:text-slate-900 bg-slate-100 p-3 rounded-full transition-all z-10 shadow-sm"><X size={24} /></button>
            
            <div className="mb-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Modificar Cadastro</h3>
              <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">Perfil: {userEmEdicao.nome}</p>
            </div>

            <form onSubmit={handleGravarEdicao} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Nome Completo</label>
                  <input required type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.nome} onChange={e => setFormEdicao({...formEdicao, nome: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">E-mail</label>
                  <input required type="email" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.email} onChange={e => setFormEdicao({...formEdicao, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Nível de Role</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-blue-500 transition-all" value={formEdicao.role} onChange={e => setFormEdicao({...formEdicao, role: e.target.value})}>
                    <option value="utente">Utente</option>
                    <option value="secretaria">Secretaria</option>
                    <option value="medico">Médico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Hospital Afiliado</label>
                  <select required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.hospital_id} onChange={e => setFormEdicao({...formEdicao, hospital_id: e.target.value})}>
                    {hospitais.map(h => (<option key={h.id} value={h.id}>{h.nome}</option>))}
                  </select>
                </div>
              </div>

              {formEdicao.role === 'utente' && (
                <div className="p-8 bg-blue-50/50 border-2 border-blue-100 rounded-[2.5rem] space-y-6 animate-in border-dashed">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Dados Clínicos / Ficha de Utente</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Nº Utente SNS</label>
                      <input type="text" placeholder="SNS" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-mono font-black outline-none focus:border-blue-500 transition-all" value={formEdicao.nr_utente} onChange={e => setFormEdicao({...formEdicao, nr_utente: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Idade</label>
                      <input type="number" placeholder="Anos" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.idade} onChange={e => setFormEdicao({...formEdicao, idade: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Altura</label>
                      <input type="number" placeholder="cm" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.altura} onChange={e => setFormEdicao({...formEdicao, altura: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Morada de Residência</label>
                    <input type="text" placeholder="Rua, Número, Código Postal" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.morada} onChange={e => setFormEdicao({...formEdicao, morada: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Historial Clínico Relevante</label>
                    <textarea placeholder="Histórico, Alergias, Doenças Crónicas..." rows={3} className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={formEdicao.descricao} onChange={e => setFormEdicao({...formEdicao, descricao: e.target.value})} />
                  </div>
                </div>
              )}

              {(formEdicao.role === 'medico' || formEdicao.role === 'secretaria') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-amber-50/50 border-2 border-amber-100 rounded-[2.5rem] border-dashed animate-in">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-amber-700 ml-1 tracking-widest">Nº Funcionário</label>
                    <input required type="text" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-mono font-black outline-none focus:border-amber-500 transition-all" value={formEdicao.nr_funcionario} onChange={e => setFormEdicao({...formEdicao, nr_funcionario: e.target.value})} />
                  </div>
                  {formEdicao.role === 'medico' && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-amber-700 ml-1 tracking-widest">Especialidade Médica</label>
                      <select required className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-amber-500 transition-all" value={formEdicao.especialidade} onChange={e => setFormEdicao({...formEdicao, especialidade: e.target.value})}>
                        <option value="">Selecione Especialidade...</option>
                        {especialidades.map(esp => (<option key={esp} value={esp}>{esp}</option>))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t-2 border-slate-100 pt-8">
                <label className="text-[10px] uppercase font-black text-red-500 ml-1 tracking-widest mb-2 block">Segurança: Re-definir Password (Opcional)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="password" placeholder="Deixe vazio para manter a atual" minLength={6} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-red-500 transition-all" value={formEdicao.password} onChange={e => setFormEdicao({...formEdicao, password: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98] mb-4">
                <Save size={24} /> Gravar Alterações Críticas
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
