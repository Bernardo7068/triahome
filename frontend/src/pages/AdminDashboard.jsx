import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Users, Building, PlusCircle, UserPlus, Stethoscope, Briefcase, Lock, Edit2, X, Save, BarChart3, Search, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [hospitais, setHospitais] = useState([]);
  
  // Utilizadores Paginação
  const [utilizadores, setUtilizadores] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUtilizadores, setTotalUtilizadores] = useState(0);

  // Auditoria Paginação
  const [auditoria, setAuditoria] = useState([]);
  const [paginaAuditoria, setPaginaAuditoria] = useState(1);
  const [totalPaginasAuditoria, setTotalPaginasAuditoria] = useState(1);

  const [counts, setCounts] = useState({ medicos: 0, secretaria: 0, utentes: 0 });
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("medicos");
  const [filtro, setFiltro] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  
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

  const fetchResumo = async () => {
    try {
      const resTotais = await api.get('/admin/utilizadores/resumo');
      setCounts({
        medicos: (resTotais.data.medico || 0) + (resTotais.data.diretor || 0),
        secretaria: resTotais.data.secretaria || 0,
        utentes: resTotais.data.utente || 0,
      });
    } catch (e) {
      console.error("Erro ao carregar totais", e);
    }
  }

  const fetchHospitais = async () => {
    try {
      const resHospitais = await api.get('/admin/hospitais');
      const dadosHospitais = resHospitais.data || [];
      setHospitais(dadosHospitais);
      if (dadosHospitais.length > 0 && !form.hospital_id) {
        setForm(prev => ({ ...prev, hospital_id: String(dadosHospitais[0].id) }));
      }
    } catch (e) {
      console.error("Erro ao carregar hospitais", e);
    }
  }

  const fetchUtilizadores = async (page = 1, tab = abaAtiva, search = filtro) => {
    try {
      let roleDb = tab;
      if (tab === 'medicos') roleDb = 'medico';
      if (tab === 'utentes') roleDb = 'utente';
      
      const res = await api.get(`/admin/utilizadores?page=${page}&role=${tab === 'auditoria' ? 'todos' : roleDb}&search=${search}`);
      setUtilizadores(res.data.data || []);
      setPaginaAtual(res.data.current_page);
      setTotalPaginas(res.data.last_page);
      setTotalUtilizadores(res.data.total);
    } catch (error) {
      console.error("Erro ao carregar utilizadores", error);
    }
  };

  const fetchAuditoria = async (page = 1) => {
    try {
      const res = await api.get(`/admin/auditoria?page=${page}`);
      setAuditoria(res.data.data || []);
      setPaginaAuditoria(res.data.current_page);
      setTotalPaginasAuditoria(res.data.last_page);
    } catch (error) {
      console.error("Erro ao carregar auditoria", error);
    }
  }

  useEffect(() => {
    fetchResumo();
    fetchHospitais();
  }, []);

  useEffect(() => {
    if (abaAtiva === 'auditoria') {
      fetchAuditoria(paginaAuditoria);
    } else {
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        fetchUtilizadores(paginaAtual, abaAtiva, filtro);
      }, 300);
      setSearchTimeout(timeout);
    }
  }, [abaAtiva, paginaAtual, paginaAuditoria, filtro]);

  useEffect(() => {
    setPaginaAtual(1);
    setPaginaAuditoria(1);
  }, [abaAtiva]);


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
      setForm(prev => ({ ...prev, nome: "", email: "", password: "", nr_funcionario: "", especialidade: "" }));
      fetchResumo();
      fetchUtilizadores(1);
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
      
      await api.post("/auditoria/registar", {
        user_id: user.id,
        acao: 'editou_perfil_utilizador',
        detalhes: `Editou ID #${userEmEdicao.id} (${formEdicao.role})`
      }).catch(e => console.error(e));

      alert("Utilizador atualizado com sucesso!");
      setUserEmEdicao(null);
      fetchResumo();
      fetchUtilizadores(paginaAtual);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao atualizar dados.");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8 pb-20 text-left">
      
      {/* CABEÇALHO UNIFICADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-[3rem] border shadow-sm mt-8">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-4 rounded-2xl text-white">
            <Lock size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Consola de Administração</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Acesso Root • Sistema & RGPD</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO DE CRIAÇÃO */}
        <div className="xl:col-span-4 space-y-6 text-left">
          <div className="bg-white rounded-[3rem] border shadow-sm p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg shadow-slate-200"><UserPlus size={28} /></div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-slate-900">Novo Cadastro</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Adicionar</p>
              </div>
            </div>

            <form onSubmit={handleCriarStaff} className="space-y-5 text-left">
              <div>
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Cargo / Nível de Acesso</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 text-sm outline-none focus:border-blue-500 transition-all" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="medico">👨‍⚕️ Médico(a)</option>
                  <option value="diretor">⚕️ Diretor Clínico</option>
                  <option value="secretaria">👩‍💻 Secretaria / Triagem</option>
                  <option value="utente">👤 Utente / Paciente</option>
                  <option value="admin">🔑 Administrador Geral</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Hospital Alocado</label>
                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.hospital_id} onChange={e => setForm({...form, hospital_id: e.target.value})}>
                  {hospitais.map(h => (<option key={h.id} value={h.id}>{h.nome}</option>))}
                </select>
              </div>

              <div className="space-y-4 text-left">
                <input required type="text" placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                <input required type="email" placeholder="E-mail de Acesso" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <input required type="password" placeholder="Palavra-passe Inicial" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                
                {form.role !== 'admin' && form.role !== 'utente' && (
                  <input required type="text" placeholder="Nº de Funcionário (Ex: SEC001)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black outline-none focus:border-blue-500 transition-all" value={form.nr_funcionario} onChange={e => setForm({...form, nr_funcionario: e.target.value})} />
                )}
              </div>

              {(form.role === 'medico' || form.role === 'diretor') && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Especialidade Médica</label>
                  <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})}>
                    <option value="">Selecione Especialidade...</option>
                    {especialidades.map(esp => (<option key={esp} value={esp}>{esp}</option>))}
                  </select>
                </div>
              )}

              <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50 shadow-xl shadow-slate-100 mt-4">
                Adicionar <PlusCircle size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* COLUNA DIREITA: GESTÃO DE LISTAS */}
        <div className="xl:col-span-8 space-y-6 text-left">
          
          {/* MENU DE ABAS E PESQUISA */}
          <div className="bg-white p-3 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row items-center gap-4">
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
              <button onClick={() => setAbaAtiva("auditoria")} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${abaAtiva === 'auditoria' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                <ShieldCheck size={18} /> Auditoria (RGPD)
              </button>
            </div>
          </div>
          
          {/* BARRA DE PESQUISA */}
          {abaAtiva !== 'auditoria' && (
            <div className="relative w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={`Pesquisar na base de dados de ${abaAtiva}...`}
                className="w-full pl-14 pr-6 py-5 bg-white border shadow-sm rounded-[2.5rem] text-sm font-medium outline-none focus:border-blue-500 transition-all"
                value={filtro}
                onChange={e => {
                  setFiltro(e.target.value);
                  setPaginaAtual(1);
                }}
              />
            </div>
          )}

          {/* LISTAGEM DE UTILIZADORES */}
          {abaAtiva !== 'auditoria' && (
            <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden h-[600px] flex flex-col justify-between">
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] sticky top-0 z-10">
                    <tr>
                      <th className="p-8 pl-10">Identificação</th>
                      <th className="p-8">Hospital</th>
                      <th className="p-8">Detalhes</th>
                      <th className="p-8 text-right pr-10">Gerir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {utilizadores.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 pl-10">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                              (u.role === 'medico' || u.role === 'diretor') ? 'bg-blue-50 text-blue-600' :
                              u.role === 'secretaria' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-base">{u.nome}</p>
                              <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl w-fit">
                            <Building size={12} /> {u.hospital_nome || "Sem Hospital"}
                          </div>
                        </td>
                        <td className="p-6">
                          {(u.role === 'medico' || u.role === 'diretor') && (
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
                        <td className="p-6 text-right pr-10">
                          <button 
                            onClick={() => iniciarEdicao(u)} 
                            className="p-3 bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {utilizadores.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-300">
                            <Users size={64} className="opacity-20" />
                            <p className="font-black uppercase tracking-[0.2em] text-sm">Nenhum registo encontrado</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* CONTROLOS DE PAGINAÇÃO (UTILIZADORES) */}
              {totalPaginas > 1 && (
                <div className="bg-slate-50 p-6 border-t flex items-center justify-between shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    A mostrar página {paginaAtual} de {totalPaginas} <span className="lowercase font-medium">({totalUtilizadores} total)</span>
                  </p>
                  <div className="flex gap-2">
                    <button 
                      disabled={paginaAtual === 1}
                      onClick={() => setPaginaAtual(p => p - 1)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      disabled={paginaAtual === totalPaginas}
                      onClick={() => setPaginaAtual(p => p + 1)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LISTAGEM DE AUDITORIA (RGPD) */}
          {abaAtiva === 'auditoria' && (
            <div className="bg-white rounded-[3rem] border-2 border-red-100 shadow-sm overflow-hidden h-[600px] flex flex-col justify-between animate-in fade-in duration-300">
              <div className="bg-red-50 p-8 border-b border-red-100 flex items-center gap-4 shrink-0">
                <ShieldCheck size={32} className="text-red-500" />
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Registo de Auditoria de Acessos</h2>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Conformidade Legal RGPD</p>
                </div>
              </div>
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white border-b text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] sticky top-0 z-10">
                    <tr>
                      <th className="p-6 pl-10">Data / Hora</th>
                      <th className="p-6">Autor da Ação</th>
                      <th className="p-6">Ação Realizada</th>
                      <th className="p-6 pr-10">Detalhes do Alvo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {auditoria.map((a, i) => (
                      <tr key={i} className="hover:bg-red-50/30 transition-colors">
                        <td className="p-6 pl-10 font-mono text-xs text-slate-500">
                          {new Date(a.criado_em).toLocaleString('pt-PT')}
                        </td>
                        <td className="p-6">
                          <p className="font-bold text-slate-800">{a.autor_nome}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{a.autor_role}</p>
                        </td>
                        <td className="p-6">
                          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
                            {a.acao}
                          </span>
                        </td>
                        <td className="p-6 pr-10 text-slate-600 font-medium italic">
                          "{a.detalhes || 'Sem detalhes'}"
                        </td>
                      </tr>
                    ))}
                    {auditoria.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-slate-400 font-medium italic border-dashed border-2 m-4">
                          Nenhum registo de auditoria encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* CONTROLOS DE PAGINAÇÃO (AUDITORIA) */}
              {totalPaginasAuditoria > 1 && (
                <div className="bg-slate-50 p-6 border-t flex items-center justify-between shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    A mostrar página {paginaAuditoria} de {totalPaginasAuditoria}
                  </p>
                  <div className="flex gap-2">
                    <button 
                      disabled={paginaAuditoria === 1}
                      onClick={() => setPaginaAuditoria(p => p - 1)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      disabled={paginaAuditoria === totalPaginasAuditoria}
                      onClick={() => setPaginaAuditoria(p => p + 1)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL DE EDIÇÃO UNIFICADO */}
      {userEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 md:p-12 rounded-[4rem] w-full max-w-2xl relative shadow-2xl max-h-[90vh] overflow-y-auto text-left animate-in zoom-in-95 duration-200">
            <button onClick={() => setUserEmEdicao(null)} className="fixed md:absolute top-8 right-8 text-slate-400 hover:text-slate-900 bg-slate-100 p-3 rounded-full transition-all z-10 shadow-sm"><X size={24} /></button>
            
            <div className="mb-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Modificar Cadastro</h3>
              <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-widest">Perfil: {userEmEdicao.nome}</p>
            </div>

            <form onSubmit={handleGravarEdicao} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Nome Completo</label>
                  <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.nome} onChange={e => setFormEdicao({...formEdicao, nome: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">E-mail</label>
                  <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.email} onChange={e => setFormEdicao({...formEdicao, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Nível de Role</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-blue-500 transition-all" value={formEdicao.role} onChange={e => setFormEdicao({...formEdicao, role: e.target.value})}>
                    <option value="utente">Utente</option>
                    <option value="secretaria">Secretaria</option>
                    <option value="medico">Médico</option>
                    <option value="diretor">Diretor Clínico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Hospital Afiliado</label>
                  <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.hospital_id} onChange={e => setFormEdicao({...formEdicao, hospital_id: e.target.value})}>
                    {hospitais.map(h => (<option key={h.id} value={h.id}>{h.nome}</option>))}
                  </select>
                </div>
              </div>

              {formEdicao.role === 'utente' && (
                <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] space-y-6 animate-in border-dashed">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Dados Clínicos / Ficha de Utente</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Nº Utente SNS</label>
                      <input type="text" placeholder="SNS" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono font-black outline-none focus:border-blue-500 transition-all" value={formEdicao.nr_utente} onChange={e => setFormEdicao({...formEdicao, nr_utente: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Idade</label>
                      <input type="number" placeholder="Anos" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.idade} onChange={e => setFormEdicao({...formEdicao, idade: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Altura</label>
                      <input type="number" placeholder="cm" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.altura} onChange={e => setFormEdicao({...formEdicao, altura: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Morada de Residência</label>
                    <input type="text" placeholder="Rua, Número, Código Postal" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formEdicao.morada} onChange={e => setFormEdicao({...formEdicao, morada: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-blue-400 ml-1">Historial Clínico Relevante</label>
                    <textarea placeholder="Histórico, Alergias, Doenças Crónicas..." rows={3} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all" value={formEdicao.descricao} onChange={e => setFormEdicao({...formEdicao, descricao: e.target.value})} />
                  </div>
                </div>
              )}

              {(formEdicao.role === 'medico' || formEdicao.role === 'secretaria' || formEdicao.role === 'diretor') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-amber-50/50 border border-amber-100 rounded-[2.5rem] border-dashed animate-in">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-amber-700 ml-1 tracking-widest">Nº Funcionário</label>
                    <input required type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono font-black outline-none focus:border-amber-500 transition-all" value={formEdicao.nr_funcionario} onChange={e => setFormEdicao({...formEdicao, nr_funcionario: e.target.value})} />
                  </div>
                  {(formEdicao.role === 'medico' || formEdicao.role === 'diretor') && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-amber-700 ml-1 tracking-widest">Especialidade Médica</label>
                      <select required className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-amber-500 transition-all" value={formEdicao.especialidade} onChange={e => setFormEdicao({...formEdicao, especialidade: e.target.value})}>
                        <option value="">Selecione Especialidade...</option>
                        {especialidades.map(esp => (<option key={esp} value={esp}>{esp}</option>))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-200 pt-8">
                <label className="text-[10px] uppercase font-black text-red-500 ml-1 tracking-widest mb-2 block">Segurança: Re-definir Password (Opcional)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="password" placeholder="Deixe vazio para manter a atual" minLength={6} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-red-500 transition-all" value={formEdicao.password} onChange={e => setFormEdicao({...formEdicao, password: e.target.value})} />
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