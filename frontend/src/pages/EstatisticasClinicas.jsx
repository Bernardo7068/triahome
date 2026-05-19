import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { analisarEstatisticas } from "../services/estatisticasAnalisisService";
import {
  ArrowLeft,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Search,
  ShieldAlert,
  Stethoscope,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const COLOR_ORDER = ["vermelho", "laranja", "amarelo", "verde", "azul", "autocuidado"];

const COLOR_META = {
  vermelho: { label: "Vermelho", tone: "bg-red-500", light: "bg-red-50 text-red-700" },
  laranja: { label: "Laranja", tone: "bg-orange-500", light: "bg-orange-50 text-orange-700" },
  amarelo: { label: "Amarelo", tone: "bg-amber-500", light: "bg-amber-50 text-amber-700" },
  verde: { label: "Verde", tone: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700" },
  azul: { label: "Azul", tone: "bg-sky-500", light: "bg-sky-50 text-sky-700" },
  autocuidado: { label: "Autocuidado", tone: "bg-slate-500", light: "bg-slate-100 text-slate-600" },
};

const severityRank = {
  vermelho: 1,
  laranja: 2,
  amarelo: 3,
  verde: 4,
  azul: 5,
  autocuidado: 5,
};

const symptomRules = [
  {
    group: "Respiratório",
    keywords: ["falta de ar", "dificuldade respiratória", "dispneia", "tosse", "pieira", "chiado", "asma", "saturação"],
    category: "laranja",
    explanation: "sintomas respiratórios com potencial de agravamento",
  },
  {
    group: "Torácico / Cardíaco",
    keywords: ["dor no peito", "aperto no peito", "pressão no peito", "enfarte", "arritmia", "palpitações fortes"],
    category: "laranja",
    explanation: "sintomas torácicos que merecem avaliação rápida",
  },
  {
    group: "Neurológico",
    keywords: ["convuls", "desmaio", "inconsciente", "confusão", "fraqueza num lado", "fala enrolada", "avc", "dormência"],
    category: "vermelho",
    explanation: "sinais neurológicos de alta prioridade",
  },
  {
    group: "Hemorragia / Trauma grave",
    keywords: ["hemorragia", "sangramento intenso", "ferida profunda", "trauma grave", "fratura exposta", "queda com"],
    category: "vermelho",
    explanation: "trauma ou hemorragia com risco imediato",
  },
  {
    group: "Febre / Infeção",
    keywords: ["febre alta", "febre", "calafrios", "infeção", "infecc", "gripe", "mal-estar geral"],
    category: "amarelo",
    explanation: "quadro infeccioso relevante",
  },
  {
    group: "Digestivo",
    keywords: ["vómit", "vomit", "náuse", "diarreia", "dor abdominal", "barriga", "perda de apetite"],
    category: "amarelo",
    explanation: "sintomas gastrointestinais que pedem avaliação",
  },
  {
    group: "Músculo-esquelético",
    keywords: ["fratura", "entorse", "pancada", "queda", "dor no joelho", "dor no braço", "dor na perna", "dor lombar"],
    category: "verde",
    explanation: "dor ou trauma leve a moderado",
  },
  {
    group: "Sintomas ligeiros",
    keywords: ["constipação", "dor ligeira", "dor de garganta", "nariz entupido", "tosse leve", "dor muscular ligeira"],
    category: "autocuidado",
    explanation: "quadro compatível com autocuidado ou baixa urgência",
  },
];

function normalizeCategory(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("vermel")) return "vermelho";
  if (text.includes("laranj")) return "laranja";
  if (text.includes("amarel")) return "amarelo";
  if (text.includes("verd")) return "verde";
  if (text.includes("azul")) return "azul";
  if (text.includes("autocuidado") || text.includes("auto cuidado")) return "autocuidado";
  return "autocuidado";
}

function detectGroups(texto) {
  const lower = String(texto || "").toLowerCase();
  return symptomRules.filter((rule) => rule.keywords.some((keyword) => lower.includes(keyword))).map((rule) => rule.group);
}

function inferExpectedCategory(texto) {
  const lower = String(texto || "").toLowerCase();
  const hasAny = (...terms) => terms.some((term) => lower.includes(term));

  if (hasAny("paragem cardiorrespiratória", "paragem respiratória", "sem pulso", "inconsciente", "hemorragia massiva", "anafilaxia", "convulsão prolongada", "crise convulsiva", "afogamento")) {
    return { category: "vermelho", reason: "risco imediato de vida" };
  }

  if (hasAny("falta de ar", "dificuldade respiratória", "dor no peito", "aperto no peito", "desmaio", "avc", "fraqueza num lado", "febre alta", "saturação", "hemorragia", "dor intensa")) {
    return { category: "laranja", reason: "sintomas potencialmente graves" };
  }

  if (hasAny("febre", "vómit", "vomit", "diarreia", "dor abdominal", "fratura", "entorse", "infeção", "gripe", "dor persistente")) {
    return { category: "amarelo", reason: "quadro que merece avaliação" };
  }

  if (hasAny("constipação", "dor ligeira", "tosse", "dor de garganta", "nariz entupido", "dor muscular", "cabeça ligeira")) {
    return { category: "verde", reason: "sintomas estáveis ou ligeiros" };
  }

  if (hasAny("medicação", "receita", "renovar", "repetir", "seguimento", "rotina")) {
    return { category: "autocuidado", reason: "pedido administrativo ou de baixa urgência" };
  }

  return { category: "amarelo", reason: "sem pistas suficientes para reduzir a urgência" };
}

function groupBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function SimpleMetric({ label, value, icon, tone }) {
  return (
    <div className={`rounded-[1.75rem] p-4 shadow-sm ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-75">{label}</p>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

export default function EstatisticasClinicas({ user }) {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [filaHospital, setFilaHospital] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [analiseCarregando, setAnaliseCarregando] = useState(false);
  const [analiseResultado, setAnaliseResultado] = useState(null);
  const [erroAnalise, setErroAnalise] = useState("");
  const [suspeitaExpandidaId, setSuspeitaExpandidaId] = useState(null);

  const hospitalId = user?.hospital_id || 1;

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

        const pedidos = [
          api.get(`/historico/${user.id}/admin`).then((res) => res.data || []),
          api.get(`/medico/fila?hospital_id=${hospitalId}`).then((res) => res.data || []),
        ];

        const [consultasData, filaData] = await Promise.all(pedidos);
        setConsultas(consultasData);
        setFilaHospital(filaData);
        setHistorico(consultasData);
      } catch (e) {
        setErro(e.message || "Erro ao carregar estatísticas");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [hospitalId, user?.id]);

  const iniciarAnalise = async () => {
    try {
      setAnaliseCarregando(true);
      setErroAnalise("");

      const payload = {
        session_id: `analise-${Date.now()}`,
        source: "frontend-estatisticas",
        estatisticas: {
          total_consultas: totalIA,
          distribuicao_cores: countsByColor,
          conformidade_estrutural: totalIA ? Math.round((structuredCount / totalIA) * 100) : 0,
          taxa_alerta: totalIA ? Math.round((suspiciousCount / totalIA) * 100) : 0,
        },
        triagens: analisadas.slice(0, 10).map((item) => ({
          id: item.id,
          categoria: item.categoria,
          resumo: item.resumo,
          diagnostico: item.diagnostico,
          prescricao: item.prescricao,
          alertas: item.alertas,
          confidence: item.confidence,
          paciente: item.utente_nome || item.nome_utente || "Paciente desconhecido",
          hospital_id: item.hospital_id,
        })),
        sintomas_top: Object.entries(countsByGroup)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([group, count]) => ({ grupo: group, ocorrencias: count })),
      };

      const resultado = await analisarEstatisticas(payload);
      setAnaliseResultado(resultado);
    } catch (e) {
      setErroAnalise(e.message || "Erro ao analisar estatísticas");
    } finally {
      setAnaliseCarregando(false);
    }
  };

  const analisadas = useMemo(() => {
    return consultas.map((item) => {
      const resumo = [item.resumo_ia, item.diagnostico, item.prescricao].filter(Boolean).join(" \n");
      const categoria = normalizeCategory(item.cor_manchester || item.categoria || item.resultado || "");
      const expected = inferExpectedCategory(resumo);
      const groups = detectGroups(resumo);
      const structureScore = [item.cor_manchester, item.resumo_ia, item.diagnostico, item.prescricao].filter(Boolean).length * 16;
      const detailBonus = Math.min(20, Math.floor((item.diagnostico || "").length / 10) + Math.floor((item.prescricao || "").length / 20));
      const mismatchPenalty = Math.abs(severityRank[categoria] - severityRank[expected.category]) * 12;
      const keywordPenalty = groups.length === 0 ? 10 : 0;
      const confidence = Math.max(0, Math.min(100, structureScore + detailBonus + (groups.length > 0 ? 10 : 0) - mismatchPenalty - keywordPenalty));

      const alertas = [];
      if (!item.cor_manchester || !item.resumo_ia || !item.diagnostico || !item.prescricao) alertas.push("Consulta pouco estruturada");
      if (mismatchPenalty >= 24) {
        alertas.push(`Categoria sugere ${COLOR_META[categoria].label}, mas os sintomas apontam para ${COLOR_META[expected.category].label}`);
      }
      if (groups.length === 0) alertas.push("Não foi possível identificar um grupo clínico claro");
      if ((item.diagnostico || "").length < 8) alertas.push("Diagnóstico muito curto");

      return {
        ...item,
        resumo,
        diagnostico: item.diagnostico || "",
        prescricao: item.prescricao || "",
        categoria,
        expected,
        groups,
        confidence,
        alertas,
        suspicious: alertas.length > 0,
      };
    });
  }, [consultas]);

  const countsByColor = useMemo(() => {
    const counts = COLOR_ORDER.reduce((acc, color) => {
      acc[color] = 0;
      return acc;
    }, {});
    analisadas.forEach((item) => {
      counts[item.categoria] = (counts[item.categoria] || 0) + 1;
    });
    return counts;
  }, [analisadas]);

  const countsByGroup = useMemo(() => {
    const groups = {};
    analisadas.forEach((item) => {
      const labels = item.groups.length ? item.groups : ["Sem grupo claro"];
      labels.forEach((group) => {
        groups[group] = (groups[group] || 0) + 1;
      });
    });
    return groups;
  }, [analisadas]);

  const detalhesPorTriagemId = useMemo(() => {
    const mapa = new Map();
    analisadas.forEach((item) => {
      mapa.set(String(item.id), item);
      if (item.triagem_id) {
        mapa.set(String(item.triagem_id), item);
      }
    });
    return mapa;
  }, [analisadas]);

  const totalIA = analisadas.length;
  const suspiciousCount = analisadas.filter((item) => item.suspicious).length;
  const structuredCount = analisadas.filter((item) => item.categoria && item.resumo && item.diagnostico && item.prescricao).length;
  const avgConfidence = totalIA ? Math.round(analisadas.reduce((acc, item) => acc + item.confidence, 0) / totalIA) : 0;
  const pendingQueue = filaHospital.filter((item) => item.estado_fila === "aguardar").length;
  const inConsultation = filaHospital.filter((item) => item.estado_fila === "em_consulta").length;
  const completed = historico.length;
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600 mb-2">Painel clínico</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">Estatísticas detalhadas das consultas</h1>
            <p className="mt-3 max-w-3xl text-slate-500 leading-relaxed">
              Visão para médico e secretaria: distribuição de cores, sintomas mais frequentes, casos incoerentes e consultas que pedem revisão manual.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SimpleMetric label="Consultas" value={totalIA} icon={<ClipboardList size={18} />} tone="bg-slate-900 text-white" />
          <SimpleMetric label="Fila ativa" value={pendingQueue + inConsultation} icon={<Stethoscope size={18} />} tone="bg-blue-600 text-white" />
          <SimpleMetric label="Possíveis falhas" value={suspiciousCount} icon={<ShieldAlert size={18} />} tone="bg-amber-500 text-white" />
          <SimpleMetric label="Confiança média" value={`${avgConfidence}%`} icon={<TrendingUp size={18} />} tone="bg-emerald-600 text-white" />
        </div>
      </div>

      {erro && <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 font-medium">{erro}</div>}

      <div className="grid gap-6">
        <section className="rounded-[2.5rem] border bg-white shadow-sm p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Distribuição Manchester</p>
              <h2 className="text-2xl font-black tracking-tighter text-slate-900">Cores de pulseira e volume de casos</h2>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conformidade estrutural</p>
              <p className="text-2xl font-black text-slate-900">{totalIA ? Math.round((structuredCount / totalIA) * 100) : 0}%</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 font-medium">A carregar estatísticas...</div>
          ) : totalIA === 0 ? (
            <div className="py-20 text-center text-slate-400 font-medium">Ainda não existem consultas guardadas na base de dados.</div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="flex flex-col items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  {COLOR_ORDER.map((color) => {
                    const count = countsByColor[color] || 0;
                    const pct = totalIA ? Math.round((count / totalIA) * 100) : 0;
                    return (
                      <div key={color} className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${COLOR_META[color].tone}`} />
                            <span className="text-sm font-black text-slate-700">{COLOR_META[color].label}</span>
                          </div>
                          <span className="text-xs font-black text-slate-400">{pct}%</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className={`h-full rounded-full ${COLOR_META[color].tone}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500 font-medium">{count} casos</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {COLOR_ORDER.map((color) => {
                  const count = countsByColor[color] || 0;
                  const pct = totalIA ? Math.round((count / totalIA) * 100) : 0;
                  return (
                    <div key={color} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                        <span className="flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${COLOR_META[color].tone}`} />
                          {COLOR_META[color].label}
                        </span>
                        <span>{count} casos · {pct}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${COLOR_META[color].tone}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <MiniStat label="Casos em consulta" value={inConsultation} />
                  <MiniStat label="Finalizados" value={completed} />
                  <MiniStat label="Cores de risco" value={countsByColor.vermelho + countsByColor.laranja} />
                  <MiniStat label="Baixa urgência" value={countsByColor.autocuidado + countsByColor.azul} />
                </div>
              </div>
            </div>
          )}
        </section>

      </div>

      <section className="rounded-[2.5rem] border bg-white shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
          <BarChart3 size={14} /> Resumo operacional
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <MiniStat label="Total de consultas" value={totalIA} />
          <MiniStat label="Fila a aguardar" value={pendingQueue} />
          <MiniStat label="Consultas em curso" value={inConsultation} />
        </div>
      </section>

      <section className="rounded-[2.5rem] border bg-white shadow-sm p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Auditoria de IA</p>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900">Análise inteligente de incoerências</h2>
            <p className="mt-2 text-sm text-slate-500">Deixa a IA remota analisar os padrões e detetar possíveis falhas ou alucinações nos dados de triagem.</p>
          </div>
          <button
            onClick={iniciarAnalise}
            disabled={analiseCarregando || totalIA === 0}
            className="flex-shrink-0 flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-6 py-3 font-black hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            <Zap size={18} /> {analiseCarregando ? "A analisar..." : "Analisar agora"}
          </button>
        </div>

        {erroAnalise && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-medium mb-6">{erroAnalise}</div>
        )}

        {analiseResultado && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Risco geral</p>
                <p className={`mt-2 text-3xl font-black tracking-tight ${
                  analiseResultado.risco === "alto" ? "text-red-600" :
                  analiseResultado.risco === "medio" ? "text-amber-600" :
                  "text-green-600"
                }`}>
                  {analiseResultado.risco?.toUpperCase()}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Confiança</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{analiseResultado.confianca || 0}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Incoerências</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{analiseResultado.indicadores?.incoerencia || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Qualidade dados</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{analiseResultado.indicadores?.qualidade_dados || 0}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Resumo da análise</p>
              <p className="text-sm text-slate-700 leading-relaxed">{analiseResultado.resumo_analise}</p>
            </div>

            {analiseResultado.triagens_suspeitas && analiseResultado.triagens_suspeitas.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                  <ShieldAlert size={14} /> Triagens suspeitas
                </p>
                <div className="grid gap-3">
                  {analiseResultado.triagens_suspeitas.map((triagem, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">#{triagem.triagem_id} {triagem.paciente ? `- ${triagem.paciente}` : ""}</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Cor atribuída: {triagem.cor_atribuida || "N/D"}</p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                          Suspeita
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700"><span className="font-black text-slate-900">Motivo:</span> {triagem.motivo || "Sem motivo informado."}</p>
                      <p className="mt-2 text-sm text-slate-700"><span className="font-black text-slate-900">Ação:</span> {triagem.acao || "Sem ação recomendada."}</p>
                      <button
                        type="button"
                        onClick={() => setSuspeitaExpandidaId((prev) => (prev === String(triagem.triagem_id) ? null : String(triagem.triagem_id)))}
                        className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        {suspeitaExpandidaId === String(triagem.triagem_id) ? "Ocultar triagem" : "Ver triagem completa"}
                      </button>

                      {suspeitaExpandidaId === String(triagem.triagem_id) && (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumo clínico</p>
                            <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                              {detalhesPorTriagemId.get(String(triagem.triagem_id))?.resumo || "Sem resumo disponível."}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnóstico</p>
                            <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                              {detalhesPorTriagemId.get(String(triagem.triagem_id))?.diagnostico || "Sem diagnóstico disponível."}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prescrição</p>
                            <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                              {detalhesPorTriagemId.get(String(triagem.triagem_id))?.prescricao || "Sem prescrição disponível."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
