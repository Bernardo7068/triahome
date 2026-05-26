import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import ModalRelatorio from "./RelatorioConsulta";
import TriagemAI from "./TriagemIA";
import { Clock, CheckCircle, Volume2, PlusCircle, History, FileText, Activity, ArrowLeft, X, Save, User, Mail, Lock, Calendar, Ruler, MapPin, FileEdit, ChevronDown, Building, AlertTriangle, MessageSquare, Info, Shield } from "lucide-react";

export default function UtenteDashboard({ user, onUpdateUser, modalPerfilAberto, setModalPerfilAberto }) {
  const [estadoAtivo, setEstadoAtivo] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("inicio");
  const [iniciandoTriagem, setIniciandoTriagem] = useState(false);
  
  // ESTADOS INTERNOS DO MODAL DO PERFIL CLÍNICO
  const [hospitais, setHospitais] = useState([]);
  const [erroPerfil, setErroPerfil] = useState("");
  const [formPerfil, setFormPerfil] = useState({
    nome: user?.nome || "", email: user?.email || "", idade: user?.idade || "",
    altura: user?.altura || "", morada: user?.morada || "", hospital_id: user?.hospital_id || "",
    descricao: user?.descricao || "", password: ""
  });

  const carregarDados = async () => {
    try {
      const resEstado = await api.get(`/triagens/estado/${user.id}`);
      const dadosEstado = resEstado.data && resEstado.data.triagem_id ? resEstado.data : null;
      setEstadoAtivo(dadosEstado);

      if (dadosEstado) {
        setIniciandoTriagem(false);
      }

      const resHist = await api.get(`/historico/${user.id}/utente`);
      setHistorico(resHist.data || []);
    } catch (e) {
      console.error("Erro ao carregar dados do utente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalPerfilAberto) {
      const carregarHospitais = async () => {
        try {
          const res = await api.get("/hospitais/lotacao");
          setHospitais(res.data);
        } catch (err) {
          setHospitais([{ id: 1, nome: "Hospital de Ourém" }]);
        }
      };
      
      setFormPerfil({
        nome: user?.nome || "", email: user?.email || "", idade: user?.idade || "",
        altura: user?.altura || "", morada: user?.morada || "", hospital_id: user?.hospital_id || "",
        descricao: user?.descricao || "", password: ""
      });
      
      carregarHospitais();
    }
  }, [modalPerfilAberto, user]);

  useEffect(() => {
    carregarDados();
    const timer = setInterval(carregarDados, 5000);
    return () => clearInterval(timer);
  }, [user.id]);

  const handleAtualizarPerfil = async (e) => {
    e.preventDefault();
    setErroPerfil("");
    try {
      const res = await api.put(`/utilizadores/editar/${user.id}`, formPerfil);
      alert("Ficha clínica e perfil atualizados com sucesso!");
      if (onUpdateUser) onUpdateUser(res.data.user);
      setModalPerfilAberto(false);
    } catch (err) {
      setErroPerfil(err.response?.data?.message || "Erro ao atualizar dados.");
    }
  };

  const perfilIncompleto = !user.idade || !user.morada || !user.altura;

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Sincronizando com o Sistema Central...</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4">

      {/* AVISO DE PERFIL CLÍNICO INCOMPLETO */}
      {perfilIncompleto && (
        <div className="bg-white border-l-8 border-amber-500 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-amber-100 p-3 rounded-2xl text-amber-600"><AlertTriangle size={24} /></div>
            <div>
              <h4 className="text-slate-900 font-black uppercase text-xs tracking-widest">Ficha Clínica Incompleta</h4>
              <p className="text-slate-500 text-sm font-medium mt-1">Complete o seu perfil para que a triagem IA e os médicos tenham dados precisos para o seu diagnóstico.</p>
            </div>
          </div>
          <button onClick={() => setModalPerfilAberto(true)} className="bg-amber-500 hover:bg-slate-900 text-white text-xs font-black px-8 py-4 rounded-2xl shadow-lg shadow-amber-100 transition-all uppercase tracking-widest shrink-0">
            Atualizar Agora
          </button>
        </div>
      )}

      {/* MENU DE NAVEGAÇÃO DO UTENTE */}
      {!iniciandoTriagem && (
        <div className="flex gap-2 p-2 bg-white rounded-3xl shadow-sm border max-w-md mx-auto">
          <button onClick={() => { setAbaAtiva("inicio"); setIniciandoTriagem(false); }} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${abaAtiva === 'inicio' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Activity size={16} /> Estado Atual
          </button>
          <button onClick={() => { setAbaAtiva("historico"); setIniciandoTriagem(false); }} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${abaAtiva === 'historico' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <History size={16} /> Histórico
          </button>
        </div>
      )}

      {abaAtiva === "inicio" && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          {estadoAtivo ? (
            /* ZONA 1: O UTENTE TEM UMA TRIAGEM ATIVA */
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* ESTADO: EM CONSULTA */}
              {estadoAtivo.estado_fila === 'em_consulta' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  <div className="md:col-span-8 bg-blue-600 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Activity size={200} /></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6 bg-white/10 w-fit px-5 py-2 rounded-full backdrop-blur-md border border-white/20">
                        <span className="w-3 h-3 bg-red-400 rounded-full animate-ping"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Atendimento em Curso</span>
                      </div>
                      <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none italic uppercase">A Sua Vez Chegou!</h2>
                      <p className="text-blue-100 text-xl md:text-2xl font-medium leading-relaxed max-w-lg">
                        O médico está à sua espera. Por favor, dirija-se agora ao <span className="bg-white text-blue-600 px-6 py-1.5 rounded-2xl font-black shadow-xl inline-block mt-2 md:mt-0 uppercase">Gabinete {estadoAtivo.gabinete || '3'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-4 bg-white rounded-[3rem] p-10 border-2 border-blue-100 shadow-xl flex flex-col justify-center text-center space-y-6">
                     <div className="bg-blue-50 p-6 rounded-[2.5rem] text-blue-600 inline-block mx-auto"><Volume2 size={48} /></div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Instruções</p>
                     <p className="text-slate-600 font-bold leading-relaxed">Mantenha o telemóvel em silêncio durante a consulta e apresente o seu número de utente.</p>
                  </div>
                </div>
              )}

              {/* ESTADO: NA SALA DE ESPERA (ENTRADA VALIDADA) */}
              {(estadoAtivo.estado_triagem === 'em_espera' || estadoAtivo.estado_fila === 'aguardar') && (
                <div className="bg-white rounded-[3.5rem] shadow-2xl border-2 border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-10 md:p-16 flex flex-col justify-center text-left border-r border-slate-50">
                      <div className="bg-emerald-500 text-white w-16 h-16 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-100"><CheckCircle size={32} /></div>
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">Entrada<br/>Validada.</h2>
                      <p className="text-slate-500 text-lg font-medium leading-relaxed mb-8">O seu check-in foi concluído com sucesso. Aguarde na sala de espera até ser chamado pelo ecrã central.</p>
                      <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-[10px] tracking-widest bg-blue-50 px-5 py-3 rounded-2xl w-fit">
                        <Clock size={16} /> Estima-se 15-20 min de espera
                      </div>
                    </div>
                    <div className="bg-slate-50 p-10 md:p-16 flex flex-col items-center justify-center text-center space-y-8">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Prioridade Atribuída</p>
                      <div className="scale-150 transform mb-4"><BadgePrioridade cor={estadoAtivo.cor_manchester} /></div>
                      <div className="pt-8 border-t border-slate-200 w-full max-w-[200px]">
                         <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Especialidade</p>
                         <p className="text-slate-900 font-black text-lg uppercase tracking-tight">{estadoAtivo.especialidade || 'Clínica Geral'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ESTADO: TRIAGEM FEITA (A AGUARDAR CHECK-IN) */}
              {(estadoAtivo.estado_triagem === 'pendente' || estadoAtivo.estado_triagem === 'checkin_feito') && (
                <div className="bg-slate-900 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] text-white overflow-hidden p-1">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3.4rem] p-10 md:p-16">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                      <div className="space-y-6">
                        <div className="bg-blue-600/20 text-blue-400 p-4 rounded-3xl w-fit border border-blue-500/30"><Info size={32} /></div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight italic">Triagem Online<br/><span className="text-blue-500">Concluída.</span></h2>
                        <p className="text-slate-400 text-lg font-medium max-w-md">Para entrar na fila de espera, deve validar a sua presença na secretaria do hospital agora.</p>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col items-center space-y-6 w-full md:w-80 backdrop-blur-xl">
                        <div className="text-center">
                          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Senha de Validação</p>
                          <p className="text-6xl md:text-7xl font-mono font-black tracking-tighter text-white">#{String(estadoAtivo.triagem_id).padStart(3, '0')}</p>
                        </div>
                        <div className="w-full h-px bg-white/10"></div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center px-4">Apresente este código no balcão de admissão</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ZONA 2: O UTENTE NÃO TEM TRIAGEM */
            <div className={`${iniciandoTriagem ? 'max-w-[1600px]' : 'max-w-2xl bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-sm p-12 md:p-20 text-center'} mx-auto`}>

              {!iniciandoTriagem ? (
                <div className="space-y-10">
                  <div className="bg-blue-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-blue-600 shadow-inner">
                    <PlusCircle size={48} />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Olá, {user.nome.split(' ')[0]}</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">Não tem nenhuma triagem ativa neste momento.<br/>Se não se sente bem, inicie a nossa triagem inteligente para receber prioridade.</p>
                  </div>

                  <button
                    onClick={() => setIniciandoTriagem(true)}
                    className="bg-slate-900 text-white w-full py-6 md:py-8 rounded-[2.5rem] font-black text-xl md:text-2xl hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 italic"
                  >
                    Iniciar Triagem IA <Activity size={24} />
                  </button>
                  
                  <div className="pt-6 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                       <MessageSquare size={20} className="text-blue-500 mb-3" />
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Rápido</p>
                       <p className="text-xs font-bold text-slate-600">Resposta em menos de 2 minutos.</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                       <Shield size={20} className="text-emerald-500 mb-3" />
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Seguro</p>
                       <p className="text-xs font-bold text-slate-600">Protocolo clínico validado pelo SNS.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 md:p-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                  <button
                    onClick={() => setIniciandoTriagem(false)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black uppercase text-[10px] tracking-widest mb-10 transition-colors bg-slate-50 px-8 py-4 rounded-2xl w-fit"
                  >
                    <ArrowLeft size={16} /> Cancelar Triagem
                  </button>

                  <div className="border-t-2 border-slate-50 pt-10">
                    <TriagemAI user={user} onConcluido={carregarDados} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {abaAtiva === "historico" && (
        <section className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500 max-w-5xl mx-auto">
          <div className="flex justify-between items-end pb-4 border-b-2 border-slate-100 px-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">O Seu Historial</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{historico.length} Registos Encontrados</p>
          </div>
          
          {historico.length > 0 ? (
            <div className="grid gap-4">
              {historico.map((h, i) => (
                <div key={i} className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:border-blue-500/30 hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-8 w-full md:w-auto text-left">
                    <div className="bg-slate-50 p-6 rounded-[2rem] group-hover:bg-blue-50 transition-colors"><FileText className="text-slate-400 group-hover:text-blue-600" size={32} /></div>
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.25em] mb-1">Data da Consulta</p>
                      <p className="font-black text-2xl text-slate-900">{new Date(h.data_consulta).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      <p className="text-sm text-slate-400 font-bold uppercase mt-1 flex items-center gap-2">
                        <Building size={14} /> {h.nome_hospital || "Hospital Base"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRelatorioSelecionado(h)}
                    className="bg-slate-900 text-white w-full md:w-auto px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                  >
                    Ver Relatório
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center border-4 border-dashed rounded-[4rem] border-slate-50 text-slate-300 font-black uppercase tracking-widest">
              Nenhuma consulta registada
            </div>
          )}
        </section>
      )}

      {/* MODAL CLÍNICO */}
      {modalPerfilAberto && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 md:p-12 rounded-[4rem] w-full max-w-3xl relative shadow-[0_0_100px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-left">
            <button onClick={() => setModalPerfilAberto(false)} className="fixed md:absolute top-8 right-8 text-slate-400 hover:text-slate-900 bg-slate-100 p-3 rounded-full transition-all z-10 shadow-sm"><X size={24} /></button>
            <div className="text-center mb-12 mt-4 md:mt-0">
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">Ficha Clínica & Perfil</h2>
              <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Mantenha os seus dados vitais atualizados</p>
            </div>

            {erroPerfil && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-xs font-black uppercase tracking-widest border-2 border-red-100 text-center">{erroPerfil}</div>
            )}

            <form onSubmit={handleAtualizarPerfil} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="text" value={formPerfil.nome} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" onChange={e => setFormPerfil({...formPerfil, nome: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="email" value={formPerfil.email} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" onChange={e => setFormPerfil({...formPerfil, email: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Idade</label>
                  <input type="number" placeholder="Ex: 34" value={formPerfil.idade} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" onChange={e => setFormPerfil({...formPerfil, idade: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Altura (cm)</label>
                  <input type="number" placeholder="Ex: 172" value={formPerfil.altura} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" onChange={e => setFormPerfil({...formPerfil, altura: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Hospital</label>
                  <select value={formPerfil.hospital_id} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner appearance-none" onChange={e => setFormPerfil({...formPerfil, hospital_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {hospitais.map(h => (<option key={h.id} value={h.id}>{h.nome}</option>))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Morada de Residência</label>
                <input type="text" placeholder="Rua, Número, Localidade" value={formPerfil.morada} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" onChange={e => setFormPerfil({...formPerfil, morada: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Ficha Clínica (Histórico, Alergias, Doenças Crónicas)</label>
                <textarea rows={3} placeholder="Ex: Hipertensão, alergia a aspirinas. Medicação diária com paracetamol." value={formPerfil.descricao} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" onChange={e => setFormPerfil({...formPerfil, descricao: e.target.value})} />
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-6">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Alterar Palavra-passe (Opcional)</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" placeholder="Deixe em branco para não alterar" minLength={6} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" onChange={e => setFormPerfil({...formPerfil, password: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-blue-600 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95">
                <Save size={20} className="inline mr-2 mb-1" /> Gravar Dados de Saúde
              </button>
            </form>
          </div>
        </div>
      )}

      {relatorioSelecionado && <ModalRelatorio dados={relatorioSelecionado} onClose={() => setRelatorioSelecionado(null)} />}
    </div>
  );
}
