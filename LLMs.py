from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
import ollama
import json
import uuid
import sqlite3
from datetime import datetime
import requests

app = Flask(__name__)
app.secret_key = "triagem-secreta-2024"  # necessário para sessões Flask

# --- CONFIGURAÇÃO DE LIGAÇÃO AO LARAVEL ---
# Ajuste o IP do seu colega aqui se necessário
LARAVEL_URL = "http://192.168.31.167:8000/api/triagem/guardar-resultado"

# Configure CORS origins via environment variable `TRIAGEM_ORIGINS` (comma separated)
# Default: localhost + rede local
default_origins = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://192.168.31.155:5173,http://192.168.31.167:5173,http://192.168.31.189:5173,"
    "http://192.168.31.155:3000,http://192.168.31.167:3000,http://192.168.31.189:3000,"
    "http://localhost:3000,http://127.0.0.1:3000"
)
# Allow overriding via environment variable TRIAGEM_ORIGINS (comma-separated). Strip whitespace.
origins = [o.strip() for o in os.environ.get("TRIAGEM_ORIGINS", default_origins).split(",")]
print("[CORS] Allowed origins:", origins)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": origins}})

# --- SQLite persistence for triagem results ---
DB_PATH = os.path.join(os.path.dirname(__file__), "triagens.db")
_conn = sqlite3.connect(DB_PATH, check_same_thread=False)
_cur = _conn.cursor()
_cur.execute(
"""
CREATE TABLE IF NOT EXISTS triagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    resumo_clinico TEXT,
    categoria TEXT,
    justificacao TEXT,
    acao TEXT,
    especialidade TEXT,
    raw_text TEXT,
    utente_id INTEGER,
    utente_nome TEXT,
    hospital_id INTEGER,
    created_at TEXT
)
"""
)
_conn.commit()

# Migração: Adiciona a coluna hospital_id se ela não existir
try:
    _cur.execute("ALTER TABLE triagens ADD COLUMN hospital_id INTEGER")
    _conn.commit()
except sqlite3.OperationalError:
    pass # Coluna já existe

# ──────────────────────────────────────────────
#  ARMAZENAMENTO DE SESSÕES EM MEMÓRIA
# ──────────────────────────────────────────────
sessoes = {}  # { session_id: { "historico": [...], "perguntas": int } }

# ──────────────────────────────────────────────
#  PROMPTS DO SISTEMA
# ──────────────────────────────────────────────
SYSTEM_ENTREVISTADOR = """
Você é um assistente de triagem hospitalar simpático e empático.
A sua função é recolher informação clínica suficiente antes de classificar o paciente.

REGRAS:
1. Se a queixa inicial for vaga ou incompleta, faça EXATAMENTE UMA pergunta de cada vez.
2. Perguntas úteis incluem:
   - Há quanto tempo tem este sintoma?
   - A dor/desconforto é constante ou vai e vem?
   - Em que escala de 0-10 avalia a dor?
   - Tem febre, náuseas, vómitos, falta de ar?
   - Toma alguma medicação regularmente?
   - Tem alguma doença crónica conhecida (diabetes, hipertensão, etc.)?
   - Já teve este problema antes?
   - Aconteceu algum evento precipitante (queda, trauma, refeição, etc.)?
3. Quando tiver informação SUFICIENTE para uma triagem segura, responda APENAS com este JSON:
   {"pronto": true, "resumo_clinico": "<resumo completo em termos clínicos>"}
4. Se ainda precisar de mais informação, responda APENAS com:
   {"pronto": false, "pergunta": "<a próxima pergunta>"}
5. Nunca faça mais do que 6 perguntas no total.
6. Fale sempre em português de Portugal.
7. Responda SEMPRE com JSON válido, sem texto extra, sem markdown.
"""

SYSTEM_TRIAGEM = """
Você é um médico especialista em triagem hospitalar pelo Protocolo de Manchester.
Analise os sintomas clínicos e classifique o paciente.

CATEGORIAS:
- Vermelho: Risco imediato de vida (atuar em <10 min)
- Laranja: Muito urgente (atuar em <30 min)
- Amarelo: Urgente (atuar em <60 min)
- Verde: Pouco urgente (atuar em <120 min)
- Autocuidado: Não requer atendimento hospitalar

ESPECIALIDADES DISPONÍVEIS (Escolha a mais específica possível):
- Neurologia (Cérebro, medula, dores de cabeça intensas, convulsões, perda de força)
- Cardiologia (Coração, dor no peito, palpitações, hipertensão grave)
- Ortopedia/Traumatologia (Ossos, articulações, fraturas, entorses, quedas)
- Pediatria (Apenas se o paciente for uma criança)
- Ginecologia/Obstetrícia (Problemas femininos ou gravidez)
- Gastroenterologia (Estômago, intestinos, fígado, dores abdominais)
- Pneumologia (Pulmões, dificuldade respiratória grave, asma)
- Otorrinolaringologia (Ouvidos, nariz, garganta)
- Oftalmologia (Olhos)
- Urologia (Rins, sistema urinário)
- Dermatologia (Pele)
- Psiquiatria (Saúde mental)
- Endocrinologia (Diabetes, hormonas)
- Oncologia (Cancro)
- Nefrologia (Rins - insuficiência renal)
- Infeciologia (Febres prolongadas, infeções graves, feridas infetadas)
- Clínica Geral (Use apenas se os sintomas forem vagos ou afetarem múltiplos sistemas sem um foco claro)

FORMATO DA RESPOSTA (obrigatório):
Categoria: [Vermelho/Laranja/Amarelo/Verde/Autocuidado]
Especialidade: [Escolha uma da lista acima]
Justificação: [Breve explicação clínica]
Ação recomendada: [O que fazer a seguir]

Seja direto. Responda em português de Portugal.
"""

# ──────────────────────────────────────────────
#  UTILITÁRIOS
# ──────────────────────────────────────────────
def extrair_json(texto: str) -> dict:
    """Extrai JSON de uma resposta que pode conter markdown."""
    try:
        inicio = texto.find("{")
        fim = texto.rfind("}") + 1
        return json.loads(texto[inicio:fim])
    except (ValueError, json.JSONDecodeError):
        return {}

def determinar_cor(texto: str) -> tuple[str, str]:
    """Devolve (cor, emoji) com base no texto da triagem."""
    for cor, emoji in [("Vermelho", "🔴"), ("Laranja", "🟠"), ("Amarelo", "🟡"), ("Verde", "🟢")]:
        if cor.lower() in texto.lower():
            return cor, emoji
    return "Autocuidado", "🔵"

def safe_ollama_chat(model, messages):
    try:
        resp = ollama.chat(model=model, messages=messages)
        return {"ok": True, "resp": resp}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def fazer_triagem_manchester(resumo_clinico: str) -> dict:
    """Chama o MedGemma para classificar com o Protocolo de Manchester."""
    result = safe_ollama_chat(
        'medgemma',
        [
            {"role": "system", "content": SYSTEM_TRIAGEM},
            {"role": "user", "content": f"Sintomas clínicos:\n{resumo_clinico}"},
        ]
    )
    if not result['ok']:
        return {
            "tipo": "erro",
            "erro": "Erro ao chamar modelo MedGemma: " + result['error']
        }
    resp = result['resp']
    texto = resp["message"]["content"]
    cor, emoji = determinar_cor(texto)
    dados_extraidos = parse_triagem_text(texto)
    return {
        "tipo": "resultado",
        "resultado": texto,
        "cor": cor,
        "emoji": emoji,
        "especialidade": dados_extraidos.get("especialidade", "Clínica Geral")
    }


def parse_triagem_text(texto: str) -> dict:
    """Tenta extrair `categoria`, `especialidade`, `justificacao` e `acao` do texto devolvido pelo modelo."""
    categoria = especialidade = justificacao = acao = ""
    for line in texto.splitlines():
        linha = line.strip()
        lower = linha.lower()
        if 'categoria' in lower and ':' in linha:
            categoria = linha.split(':', 1)[1].strip()
        elif 'especialidade' in lower and ':' in linha:
            especialidade = linha.split(':', 1)[1].strip()
        elif 'just' in lower and ':' in linha:
            justificacao = linha.split(':', 1)[1].strip()
        elif ('ação' in lower or 'acao' in lower or 'recomend' in lower) and ':' in linha:
            acao = linha.split(':', 1)[1].strip()
    return {
        "categoria": categoria, 
        "especialidade": especialidade, 
        "justificacao": justificacao, 
        "acao": acao
    }


def salvar_e_notificar_laravel(session_id: str, resumo_clinico: str, texto_resultado: str, utente_id: int = None, utente_nome: str = None, hospital_id: int = None):
    """
    Insere resultado na base SQLite local E envia para a API Laravel.
    """
    dados = parse_triagem_text(texto_resultado)
    now = datetime.utcnow().isoformat() + 'Z'
    
    # 1. Guardar Localmente (SQLite)
    try:
        _cur.execute(
            "INSERT INTO triagens (session_id, resumo_clinico, categoria, justificacao, acao, especialidade, raw_text, utente_id, utente_nome, hospital_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (session_id, resumo_clinico, dados.get('categoria'), dados.get('justificacao'), dados.get('acao'), dados.get('especialidade'), texto_resultado, utente_id, utente_nome, hospital_id, now)
        )
        _conn.commit()
        print(f"[DB-LOCAL] Triagem guardada localmente para utente {utente_id}")
    except Exception as e:
        print(f"[DB-LOCAL] Erro ao guardar localmente: {e}")

    # 2. Notificar Laravel
    if utente_id:
        try:
            payload = {
                "utente_id": utente_id,
                "hospital_id": hospital_id or 1,
                "categoria": dados.get('categoria'),
                "justificacao": dados.get('justificacao'),
                "acao": dados.get('acao'),
                "resumo_clinico": texto_resultado, # Usamos o relatório final da IA
                "especialidade": dados.get('especialidade')
            }
            resp = requests.post(LARAVEL_URL, json=payload, timeout=10)
            if resp.status_code in [200, 201]:
                print(f"[API-LARAVEL] Triagem enviada com sucesso para utente {utente_id}")
            else:
                print(f"[API-LARAVEL] Erro na resposta do Laravel ({resp.status_code}): {resp.text}")
        except Exception as e:
            print(f"[API-LARAVEL] Erro de ligação ao enviar para Laravel: {e}")

# ──────────────────────────────────────────────
#  ROTAS
# ──────────────────────────────────────────────

@app.route('/iniciar', methods=['POST'])
def iniciar():
    """
    Inicia uma nova sessão de triagem.
    Body: { "sintomas": "dói-me a barriga", "utente_id": 5, "utente_nome": "João Silva", "hospital_id": 1 }
    """
    data = request.json or {}
    sintomas = data.get("sintomas", "").strip()
    utente_id = data.get("utente_id")
    utente_nome = data.get("utente_nome", "").strip() or None
    hospital_id = data.get("hospital_id") or 1

    if not sintomas:
        return jsonify({"erro": "Nenhum sintoma fornecido"}), 400

    # Cria sessão única
    session_id = str(uuid.uuid4())
    historico = [{"role": "user", "content": f"O paciente diz: '{sintomas}'"}]

    # Primeira chamada ao entrevistador
    result = safe_ollama_chat('llama3', [{"role": "system", "content": SYSTEM_ENTREVISTADOR}] + historico)
    if not result['ok']:
        return jsonify({"erro": "Erro ao chamar modelo de entrevista: " + result['error']}), 502
    resp = result['resp']
    texto = resp["message"]["content"].strip()
    dados = extrair_json(texto)

    historico.append({"role": "assistant", "content": texto})

    if dados.get("pronto"):
        # Já tem info suficiente — avança para triagem
        resultado = fazer_triagem_manchester(dados["resumo_clinico"])
        resultado["session_id"] = session_id
        salvar_e_notificar_laravel(session_id, dados.get("resumo_clinico", ""), resultado.get("resultado", ""), utente_id, utente_nome, hospital_id)
        return jsonify(resultado)

    # Guarda sessão e devolve pergunta
    sessoes[session_id] = {
        "historico": historico,
        "perguntas": 1,
        "sintomas_originais": sintomas,
        "utente_id": utente_id,
        "utente_nome": utente_nome,
        "hospital_id": hospital_id
    }

    return jsonify({
        "tipo": "pergunta",
        "pergunta": dados.get("pergunta", "Pode dar mais detalhes?"),
        "session_id": session_id,
        "perguntas_feitas": 1
    })


@app.route('/responder', methods=['POST'])
def responder():
    """
    Continua a entrevista com a resposta do utilizador.
    Body: { "session_id": "...", "resposta": "desde ontem" }
    """
    data = request.json or {}
    session_id = data.get("session_id", "").strip()
    resposta_user = data.get("resposta", "").strip() or "(sem resposta)"

    if not session_id or session_id not in sessoes:
        return jsonify({"erro": "Sessão inválida ou expirada"}), 404

    sessao = sessoes[session_id]
    historico = sessao["historico"]
    num_perguntas = sessao["perguntas"]

    # Adiciona resposta do utilizador ao histórico
    historico.append({"role": "user", "content": resposta_user})

    # Forçar encerramento se atingiu o limite de perguntas
    if num_perguntas >= 6:
        historico.append({
            "role": "user",
            "content": "Já tens informação suficiente. Devolve o JSON com pronto:true e o resumo clínico."
        })

    # Chama o entrevistador com histórico completo
    result = safe_ollama_chat('llama3', [{"role": "system", "content": SYSTEM_ENTREVISTADOR}] + historico)
    if not result['ok']:
        return jsonify({"erro": "Erro ao chamar modelo de entrevista: " + result['error']}), 502
    resp = result['resp']
    texto = resp["message"]["content"].strip()
    dados = extrair_json(texto)

    historico.append({"role": "assistant", "content": texto})
    sessao["historico"] = historico

    if dados.get("pronto") or num_perguntas >= 6:
        # Usa o resumo do modelo ou a queixa original como fallback
        resumo = dados.get("resumo_clinico", sessao["sintomas_originais"])
        utente_id = sessao.get("utente_id")
        utente_nome = sessao.get("utente_nome")
        hospital_id = sessao.get("hospital_id")
        del sessoes[session_id]  # Limpa sessão
        resultado = fazer_triagem_manchester(resumo)
        resultado["session_id"] = session_id
        salvar_e_notificar_laravel(session_id, resumo, resultado.get("resultado", ""), utente_id, utente_nome, hospital_id)
        return jsonify(resultado)

    # Continua entrevista
    sessao["perguntas"] += 1
    sessoes[session_id] = sessao

    return jsonify({
        "tipo": "pergunta",
        "pergunta": dados.get("pergunta", "Pode dar mais detalhes?"),
        "session_id": session_id,
        "perguntas_feitas": sessao["perguntas"]
    })


@app.route('/triagem-direta', methods=['POST'])
def triagem_direta():
    """
    Triagem sem entrevista (compatibilidade com o código anterior).
    Body: { "sintomas": "...", "utente_id": 5, "utente_nome": "João Silva", "hospital_id": 1 }
    """
    data = request.json or {}
    sintomas = data.get("sintomas", "").strip()
    utente_id = data.get("utente_id")
    utente_nome = data.get("utente_nome", "").strip() or None
    hospital_id = data.get("hospital_id") or 1

    if not sintomas:
        return jsonify({"erro": "Nenhum sintoma fornecido"}), 400

    # Traduz para termos clínicos com Llama 3
    resp_llama = ollama.chat(
        model='llama3',
        messages=[
            {"role": "system", "content": "Traduz queixas do dia a dia para terminologia clínica precisa. Responde em português de Portugal."},
            {"role": "user", "content": f"Traduz para termos clínicos: '{sintomas}'"}
        ]
    )
    queixa_clinica = resp_llama["message"]["content"]

    resultado = fazer_triagem_manchester(queixa_clinica)
    
    # Guarda com utente info
    session_id = str(uuid.uuid4())
    salvar_e_notificar_laravel(session_id, queixa_clinica, resultado.get("resultado", ""), utente_id, utente_nome, hospital_id)
    
    resultado["session_id"] = session_id
    return jsonify(resultado)


@app.route('/cancelar', methods=['POST'])
def cancelar():
    """Cancela e remove uma sessão ativa."""
    data = request.json or {}
    session_id = data.get("session_id", "")
    if session_id in sessoes:
        del sessoes[session_id]
        return jsonify({"mensagem": "Sessão cancelada com sucesso"})
    return jsonify({"erro": "Sessão não encontrada"}), 404


@app.route('/status', methods=['GET'])
def status():
    """Verifica se o servidor está ativo."""
    return jsonify({
        "status": "online",
        "sessoes_ativas": len(sessoes),
        "modelos": ["llama3", "medgemma"]
    })


@app.route('/triagens', methods=['GET'])
def listar_triagens():
    """Devolve as triagens mais recentes para acesso médico."""
    _cur.execute("SELECT id, session_id, resumo_clinico, categoria, justificacao, acao, especialidade, raw_text, utente_id, utente_nome, hospital_id, created_at FROM triagens ORDER BY id DESC LIMIT 200")
    rows = _cur.fetchall()
    keys = ["id", "session_id", "resumo_clinico", "categoria", "justificacao", "acao", "especialidade", "raw_text", "utente_id", "utente_nome", "hospital_id", "created_at"]
    lista = [dict(zip(keys, r)) for r in rows]
    return jsonify(lista)


@app.route('/triagens/<int:triagem_id>', methods=['GET'])
def obter_triagem(triagem_id: int):
    _cur.execute("SELECT id, session_id, resumo_clinico, categoria, justificacao, acao, especialidade, raw_text, utente_id, utente_nome, hospital_id, created_at FROM triagens WHERE id = ?", (triagem_id,))
    r = _cur.fetchone()
    if not r:
        return jsonify({"erro": "Triagem não encontrada"}), 404
    keys = ["id", "session_id", "resumo_clinico", "categoria", "justificacao", "acao", "especialidade", "raw_text", "utente_id", "utente_nome", "hospital_id", "created_at"]
    return jsonify(dict(zip(keys, r)))


# ──────────────────────────────────────────────
#  ARRANQUE
# ──────────────────────────────────────────────
if __name__ == '__main__':
    print("[SERVER] Servidor de Triagem Inteligente a iniciar...")
    print("[SERVER] Disponível em: http://0.0.0.0:5000")
    print("[SERVER] Rotas disponíveis:")
    print("    POST /iniciar        — Inicia triagem conversacional")
    print("    POST /responder      — Continua a entrevista")
    print("    POST /triagem-direta — Triagem sem entrevista")
    print("    POST /cancelar       — Cancela sessão")
    print("    GET  /status         — Estado do servidor")
    app.run(host='0.0.0.0', port=5000, debug=True)
