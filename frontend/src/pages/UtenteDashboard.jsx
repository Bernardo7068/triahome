import { useState, useEffect } from "react";
import api from "../services/api";
import BadgePrioridade from "../components/BadgePrioridade";
import ModalRelatorio from "./RelatorioConsulta";
import TriagemAI from "./TriagemIA";
import { Clock, CheckCircle, Volume2, PlusCircle, History, FileText, Activity, ArrowLeft, X, Save, User, Mail, Lock, Calendar, Ruler, MapPin, FileEdit, ChevronDown, Building } from "lucide-react";

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

  // Carrega os hospitais se o modal de perfil for aberto pelo utilizador
  useEffect(() => {
    if (modalPerfilAberto) {
      const carregarHospitais = async () => {
        try {
          const res = await api.get("/hospitais/lotacao");
          setHospitais(res.data);
        } catch (err) {
          setHospitais([
            { id: 1, nome: "Hospital de Ourém" },
            { id: 2, nome: "Hospital de Leiria" },
            { id: 3, nome: "Hospital de Santarém" }
          ]);
        }
      };
      
      // Sincroniza o formulário com os dados mais recentes do utilizador
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
      
      if (onUpdateUser) {
        onUpdateUser(res.data.user);
      } else {
        Object.assign(user, res.data.user || formPerfil);
      }
      setModalPerfilAberto(false);
    } catch (err) {
      setErroPerfil(err.response?.data?.message || "Erro ao atualizar dados. Tente novamente.");
    }
  };

  // Verifica se faltam dados médicos cruciais para dar o alerta visual amigável
  const perfilIncompleto = !user.idade || !user.morada || !user.altura;

  if (loading) return <div className="p-10 text-center font-bold animate-pulse text-slate-400">A carregar portal do utente...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      {/* AVISO DE PERFIL CLÍNICO INCOMPLETO */}
      {perfilIncompleto && (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top duration-300">
          <div>
            <h4 className="text-amber-800 font-black text-sm">Complete a sua Ficha de Saúde!</h4>
            <p className="text-amber-600 text-xs font-medium mt-0.5">Adicione a sua idade, altura, morada e historial para que a triagem IA e os médicos o apoiem com maior precisão.</p>
          </div>
          <button 
            onClick={() => setModalPerfilAberto(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-5 py-3 rounded-xl shadow-sm transition-colors shrink-0"
          >
            Preencher Ficha
          </button>
        </div>
      )}

      {/* MENU DE NAVEGAÇÃO DO UTENTE */}
      <div className="flex gap-4 mb-6 bg-white p-2 rounded-3xl shadow-sm border max-w-xl mx-auto">
        <button
          onClick={() => { setAbaAtiva("inicio"); setIniciandoTriagem(false); }}
          className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'inicio' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Activity size={20} /> Estado Atual
        </button>
        <button
          onClick={() => { setAbaAtiva("historico"); setIniciandoTriagem(false); }}
          className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${abaAtiva === 'historico' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <History size={20} /> Histórico
        </button>
      </div>

      {abaAtiva === "inicio" && (
        <section className="animate-in fade-in duration-300">
          {estadoAtivo ? (
            /* ZONA 1: O UTENTE TEM UMA TRIAGEM ATIVA */
            <>
              {estadoAtivo.estado_fila === 'em_consulta' && (
                <div className="bg-blue-600 text-white p-12 rounded-[3.5rem] shadow-2xl text-center animate-pulse">
                  <Volume2 size={64} className="mx-auto mb-6" />
                  <h2 className="text-5xl font-black mb-4 italic tracking-tighter">Sua Vez!</h2>
                  <p className="text-blue-100 text-2xl font-medium">Dirija-se ao <span className="bg-white text-blue-600 px-6 py-2 rounded-2xl font-black shadow-lg">GABINETE {estadoAtivo.gabinete || '3'}</span></p>
                </div>
              )}

              {(estadoAtivo.estado_triagem === 'em_espera' || estadoAtivo.estado_fila === 'aguardar') && (
                <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border text-center">
                  <CheckCircle size={80} className="text-green-500 mx-auto mb-8" />
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">Entrada Validada</h2>
                  <p className="text-slate-500 mb-10 font-medium text-lg">Aguarde na Sala de Espera Geral. Será chamado pela cor.</p>
                  <BadgePrioridade cor={estadoAtivo.cor_manchester} />
                </div>
              )}

              {(estadoAtivo.estado_triagem === 'pendente' || estadoAtivo.estado_triagem === 'checkin_feito') && (
                <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl text-center">
                  <Clock size={64} className="text-blue-400 mx-auto mb-8 animate-pulse" />
                  <h2 className="text-3xl font-black mb-4 tracking-tighter">Triagem Concluída</h2>
                  <p className="text-slate-400 mb-8 font-medium text-lg">Dirija-se ao hospital para validar a sua entrada presencialmente.</p>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 inline-block px-12">
                    <p className="text-xs text-blue-400 font-black uppercase tracking-widest mb-2">Senha Virtual</p>
                    <p className="text-4xl font-mono font-black">#{estadoAtivo.triagem_id}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ZONA 2: O UTENTE NÃO TEM TRIAGEM (MOSTRAR BOTÃO OU FORMULÁRIO COM EXPANSÃO CORRETA) */
            <div className={`bg-white rounded-[3.5rem] border shadow-sm mx-auto overflow-hidden transition-all duration-700 ease-in-out transform origin-top ${iniciandoTriagem ? 'max-w-4xl opacity-100' : 'max-w-xl'}`}>

              {!iniciandoTriagem ? (
                <div className="text-center p-12 md:p-16 animate-in zoom-in-95 duration-300">
                  <PlusCircle size={64} className="text-blue-600 mx-auto mb-8" />
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Olá, {user.nome}!</h2>
                  <p className="text-slate-500 mb-10 font-medium text-lg">Não tem nenhuma triagem ativa. Se não se sente bem, inicie agora a triagem digital.</p>

                  <button
                    onClick={() => setIniciandoTriagem(true)}
                    className="bg-blue-600 text-white w-full py-6 rounded-[2rem] font-black text-xl hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 transform hover:-translate-y-1"
                  >
                    Nova Triagem IA
                  </button>
                </div>
              ) : (
                <div className="p-8 md:p-12 animate-in fade-in duration-700">
                  <button
                    onClick={() => setIniciandoTriagem(false)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold mb-6 transition-colors bg-slate-50 px-6 py-3 rounded-full w-fit"
                  >
                    <ArrowLeft size={20} /> Cancelar e Voltar
                  </button>

                  <div className="border-t border-slate-100 pt-6">
                    <TriagemAI user={user} onConcluido={carregarDados} />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {abaAtiva === "historico" && (
        <section className="space-y-4 animate-in fade-in duration-300">
          {historico.length > 0 ? (
            <div className="grid gap-4">
              {historico.map((h, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl"><FileText className="text-blue-600" size={32} /></div>
                    <div>
                      <p className="font-black text-xl text-slate-800">{new Date(h.data_consulta).toLocaleDateString()}</p>
                      <p className="text-sm text-slate-400 font-bold uppercase">{h.nome_hospital || "Hospital Base"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRelatorioSelecionado(h)}
                    className="bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Ver Relatório
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center border-2 border-dashed rounded-[3rem] text-slate-400 font-medium text-lg">
              Ainda não possui registos de consultas anteriores.
            </div>
          )}
        </section>
      )}

      {/* ==============================================================
         MODAL CLÍNICO COMPLETO EXIBIDO DIRETAMENTE NO DASHBOARD
         ============================================================== */}
      {modalPerfilAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-8 md:p-10 rounded-[3rem] w-full max-w-2xl relative shadow-2xl my-8 animate-in zoom-in-95 duration-200 text-left">
            
            <button 
              onClick={() => setModalPerfilAberto(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black tracking-tighter text-slate-900">Ficha Clínica & Perfil</h2>
              <p className="text-slate-500 font-medium text-xs mt-0.5">Estes dados otimizam a precisão do motor de triagem inteligente.</p>
            </div>

            {erroPerfil && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-xs font-bold border border-red-100 text-center">
                {erroPerfil}
              </div>
            )}

            <form onSubmit={handleAtualizarPerfil} className="space-y-4">
              
              {/* Nome e Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="text" value={formPerfil.nome} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-blue-500 transition-all" onChange={e => setFormPerfil({...formPerfil, nome: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Endereço de E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="email" value={formPerfil.email} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-blue-500 transition-all" onChange={e => setFormPerfil({...formPerfil, email: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Idade, Altura e Hospital de Referência */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Idade (Anos)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="number" placeholder="Ex: 34" value={formPerfil.idade} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-blue-500 transition-all" onChange={e => setFormPerfil({...formPerfil, idade: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Altura (cm)</label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="number" placeholder="Ex: 172" value={formPerfil.altura} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-blue-500 transition-all" onChange={e => setFormPerfil({...formPerfil, altura: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Hospital Preferencial</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                      value={formPerfil.hospital_id} 
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-blue-500 transition-all appearance-none text-slate-600"
                      onChange={e => setFormPerfil({...formPerfil, hospital_id: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {hospitais.map(h => (
                        <option key={h.id} value={h.id}>{h.nome}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
              </div>

              {/* Morada */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Morada Completa</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Rua, Número, Localidade" value={formPerfil.morada} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-blue-500 transition-all" onChange={e => setFormPerfil({...formPerfil, morada: e.target.value})} />
                </div>
              </div>

              {/* Histórico Clínico / Descrição */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Ficha Clínica (Doenças Crónicas, Alergias, Medicamentos Frequentes)</label>
                <div className="relative">
                  <FileEdit className="absolute left-4 top-4 text-slate-400" size={16} />
                  <textarea rows={3} placeholder="Ex: Hipertensão, alergia a aspirinas. Medicação diária com paracetamol." value={formPerfil.descricao} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-blue-500 transition-all" onChange={e => setFormPerfil({...formPerfil, descricao: e.target.value})} />
                </div>
              </div>

              {/* Mudar Password */}
              <div className="space-y-1 border-t border-slate-100 pt-4">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Alterar Palavra-passe (Opcional)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="password" placeholder="Deixe em branco para não alterar" minLength={6} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-blue-500 transition-all" onChange={e => setFormPerfil({...formPerfil, password: e.target.value})} />
                </div>
              </div>

              {/* Botão de Guardar */}
              <button type="submit" className="w-full bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-md">
                <Save size={16} /> Guardar Ficha e Perfil
              </button>
            </form>
          </div>
        </div>
      )}

      {relatorioSelecionado && <ModalRelatorio dados={relatorioSelecionado} onClose={() => setRelatorioSelecionado(null)} />}
    </div>
  );
}