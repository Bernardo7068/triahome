-- =============================================================
-- TRIA-Home · Esquema SQLite
-- Engenharia de Sistemas e Serviços · IPLeiria · 2026
-- =============================================================
-- Execução: sqlite3 tria_home.db < tria_home_schema.sql
-- =============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA encoding = 'UTF-8';

-- -------------------------------------------------------------
-- 1. HOSPITAIS
--    Unidades de saúde participantes no sistema.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitais (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    nome                TEXT    NOT NULL,
    morada              TEXT    NOT NULL,
    cidade              TEXT    NOT NULL,
    codigo_postal       TEXT,
    telefone            TEXT,
    capacidade_urgencia INTEGER NOT NULL DEFAULT 50,   -- nº máximo de utentes em simultâneo
    lotacao_atual       INTEGER NOT NULL DEFAULT 0,    -- utentes presentes agora
    ativo               INTEGER NOT NULL DEFAULT 1,    -- 0 = inativo
    criado_em           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 2. UTILIZADORES
--    Suporta três perfis via RBAC: utente | secretaria | medico
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilizadores (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nome             TEXT    NOT NULL,
    email            TEXT    UNIQUE NOT NULL,
    password_hash    TEXT    NOT NULL,          -- bcrypt / Argon2 em produção
    role             TEXT    NOT NULL           -- 'utente' | 'secretaria' | 'medico'
                     CHECK(role IN ('utente','secretaria','medico')),
    -- campos exclusivos de utente
    nr_utente        TEXT    UNIQUE,            -- Número de Utente SNS (simulado)
    data_nascimento  TEXT,                      -- ISO-8601 YYYY-MM-DD
    genero           TEXT    CHECK(genero IN ('M','F','O','N/A')),
    telefone         TEXT,
    -- campos exclusivos de staff
    nr_funcionario   TEXT    UNIQUE,            -- Nº de crachá hospitalar
    especialidade    TEXT,                      -- ex.: 'Medicina Geral', 'Triagem'
    hospital_id      INTEGER REFERENCES hospitais(id) ON DELETE SET NULL,
    -- controlo de sessão
    ultimo_login     TEXT,
    ativo            INTEGER NOT NULL DEFAULT 1,
    criado_em        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 3. TRIAGENS
--    Núcleo do sistema: cada submissão do questionário gera 1 linha.
--    cor_manchester segue o Protocolo de Manchester:
--      vermelho   → imediato   (0 min)
--      laranja    → muito urgente (10 min)
--      amarelo    → urgente    (60 min)
--      verde      → pouco urgente (120 min)
--      azul/branco→ não urgente (240 min / autocuidado)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS triagens (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id           INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    hospital_id         INTEGER REFERENCES hospitais(id) ON DELETE SET NULL,
    -- classificação IA
    cor_manchester      TEXT    CHECK(cor_manchester IN
                            ('vermelho','laranja','amarelo','verde','azul','branco')),
    nivel_prioridade    INTEGER CHECK(nivel_prioridade BETWEEN 1 AND 5),
                        -- 1=imediato … 5=não urgente
    resumo_ia           TEXT,                   -- texto gerado pela IA
    conselhos_autocuidado TEXT,                 -- preenchido quando cor = azul/branco
    tempo_espera_min    INTEGER,                -- estimativa devolvida ao utente
    -- ciclo de vida
    estado              TEXT    NOT NULL DEFAULT 'pendente'
                        CHECK(estado IN ('pendente','em_espera','checkin_feito',
                                         'em_consulta','finalizado','cancelado')),
    -- metadados
    criado_em           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    atualizado_em       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- trigger: atualiza atualizado_em sempre que a triagem muda
CREATE TRIGGER IF NOT EXISTS trg_triagem_update
AFTER UPDATE ON triagens
FOR EACH ROW
BEGIN
    UPDATE triagens
    SET atualizado_em = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = OLD.id;
END;

-- trigger: decrementa lotação do hospital ao cancelar / finalizar
CREATE TRIGGER IF NOT EXISTS trg_triagem_libera_vaga
AFTER UPDATE OF estado ON triagens
FOR EACH ROW
WHEN NEW.estado IN ('finalizado','cancelado')
  AND OLD.estado NOT IN ('finalizado','cancelado')
  AND NEW.hospital_id IS NOT NULL
BEGIN
    UPDATE hospitais
    SET lotacao_atual = MAX(0, lotacao_atual - 1)
    WHERE id = NEW.hospital_id;
END;

-- -------------------------------------------------------------
-- 4. RESPOSTAS_QUESTIONARIO
--    Cada pergunta/resposta do questionário clínico fica aqui.
--    Permite reconstruir o histórico completo da triagem.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS respostas_questionario (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id  INTEGER NOT NULL REFERENCES triagens(id) ON DELETE CASCADE,
    pergunta    TEXT    NOT NULL,
    resposta    TEXT    NOT NULL,
    ordem       INTEGER NOT NULL DEFAULT 0,   -- posição no questionário
    criado_em   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 5. FILA_ESPERA
--    Gestão de posições na fila por hospital e prioridade.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fila_espera (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id  INTEGER NOT NULL UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    posicao     INTEGER NOT NULL,             -- posição na fila (recalculada pela app)
    estado      TEXT    NOT NULL DEFAULT 'aguardar'
                CHECK(estado IN ('aguardar','chamado','em_consulta','concluido')),
    chamado_em  TEXT,                         -- timestamp de quando foi chamado
    criado_em   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 6. CHECKINS
--    Registo da chegada física ao hospital (secretaria / quiosque).
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkins (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id      INTEGER NOT NULL UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    secretaria_id   INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
    metodo_checkin  TEXT    NOT NULL DEFAULT 'manual'
                    CHECK(metodo_checkin IN ('manual','quiosque','rfid')),
    dados_cartao    TEXT,                     -- JSON simulado da leitura do Cartão de Cidadão
    criado_em       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- trigger: atualiza estado da triagem para 'checkin_feito' automaticamente
CREATE TRIGGER IF NOT EXISTS trg_checkin_atualiza_triagem
AFTER INSERT ON checkins
FOR EACH ROW
BEGIN
    UPDATE triagens SET estado = 'checkin_feito' WHERE id = NEW.triagem_id;
    UPDATE hospitais
    SET lotacao_atual = lotacao_atual + 1
    WHERE id = (SELECT hospital_id FROM triagens WHERE id = NEW.triagem_id);
END;

-- -------------------------------------------------------------
-- 7. CONSULTAS
--    Registo clínico da consulta realizada pelo médico.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id      INTEGER NOT NULL UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    medico_id       INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
    fila_id         INTEGER REFERENCES fila_espera(id) ON DELETE SET NULL,
    estado          TEXT    NOT NULL DEFAULT 'aguardar_medico'
                    CHECK(estado IN ('aguardar_medico','em_curso','finalizada','transferida')),
    gabinete        TEXT,                     -- ex.: 'Gabinete 3'
    notas_clinicas  TEXT,                     -- resumo escrito pelo médico
    diagnostico     TEXT,
    alta            INTEGER NOT NULL DEFAULT 0,  -- 1 = alta dada
    iniciada_em     TEXT,
    finalizada_em   TEXT,
    criado_em       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- trigger: quando consulta é finalizada, fecha a triagem
CREATE TRIGGER IF NOT EXISTS trg_consulta_finaliza_triagem
AFTER UPDATE OF estado ON consultas
FOR EACH ROW
WHEN NEW.estado = 'finalizada'
BEGIN
    UPDATE triagens SET estado = 'finalizado' WHERE id = NEW.triagem_id;
    UPDATE fila_espera SET estado = 'concluido' WHERE id = NEW.fila_id;
END;

-- -------------------------------------------------------------
-- 8. LOGS_AUDITORIA
--    Registo imutável de todas as ações relevantes no sistema.
--    Simula conformidade RGPD e rastreabilidade clínica.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    utilizador_id   INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
    acao            TEXT    NOT NULL,          -- ex.: 'LOGIN', 'TRIAGEM_CRIADA', 'CHECKIN'
    tabela_afetada  TEXT,
    registo_id      INTEGER,
    detalhes        TEXT,                      -- JSON livre com contexto extra
    ip_origem       TEXT,                      -- simulado
    criado_em       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- ÍNDICES — aceleram as queries mais comuns no protótipo
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_triagens_utente      ON triagens(utente_id);
CREATE INDEX IF NOT EXISTS idx_triagens_hospital    ON triagens(hospital_id);
CREATE INDEX IF NOT EXISTS idx_triagens_estado      ON triagens(estado);
CREATE INDEX IF NOT EXISTS idx_triagens_cor         ON triagens(cor_manchester);
CREATE INDEX IF NOT EXISTS idx_fila_hospital        ON fila_espera(hospital_id, estado);
CREATE INDEX IF NOT EXISTS idx_fila_posicao         ON fila_espera(posicao);
CREATE INDEX IF NOT EXISTS idx_respostas_triagem    ON respostas_questionario(triagem_id, ordem);
CREATE INDEX IF NOT EXISTS idx_consultas_medico     ON consultas(medico_id, estado);
CREATE INDEX IF NOT EXISTS idx_logs_utilizador      ON logs_auditoria(utilizador_id);
CREATE INDEX IF NOT EXISTS idx_logs_acao            ON logs_auditoria(acao);

-- =============================================================
-- DADOS DE DEMONSTRAÇÃO (protótipo)
-- =============================================================

-- Hospitais
INSERT INTO hospitais (nome, morada, cidade, capacidade_urgencia) VALUES
  ('Hospital de Santo André',   'Rua das Olhalvas',        'Leiria',  80),
  ('Centro Hospitalar Oeste',   'Av. Rainha D. Leonor 100','Caldas da Rainha', 60),
  ('Hospital Distrital Pombal', 'Rua Dr. Correia Mateus',  'Pombal',  40);

-- Utilizadores
-- role: utente
INSERT INTO utilizadores (nome, email, password_hash, role, nr_utente, data_nascimento, genero, telefone) VALUES
  ('Ana Ferreira',   'ana@tria.pt',    '$2b$12$demo_hash_ana',    'utente', '123456789', '1990-04-15', 'F', '912000001'),
  ('João Costa',     'joao@tria.pt',   '$2b$12$demo_hash_joao',   'utente', '987654321', '1975-11-30', 'M', '912000002'),
  ('Marta Sousa',    'marta@tria.pt',  '$2b$12$demo_hash_marta',  'utente', '555555555', '2001-07-22', 'F', '912000003');

-- role: secretaria (hospital 1)
INSERT INTO utilizadores (nome, email, password_hash, role, nr_funcionario, hospital_id) VALUES
  ('Carla Mendes',   'carla.mendes@hsa.min-saude.pt',  '$2b$12$demo_hash_carla',  'secretaria', 'F001', 1),
  ('Rui Oliveira',   'rui.oliveira@hsa.min-saude.pt',  '$2b$12$demo_hash_rui',    'secretaria', 'F002', 2);

-- role: medico (hospital 1)
INSERT INTO utilizadores (nome, email, password_hash, role, nr_funcionario, especialidade, hospital_id) VALUES
  ('Dr. Pedro Lopes',   'p.lopes@hsa.min-saude.pt',   '$2b$12$demo_hash_pedro',  'medico', 'M001', 'Medicina Geral',  1),
  ('Dra. Sofia Neves',  's.neves@hsa.min-saude.pt',   '$2b$12$demo_hash_sofia',  'medico', 'M002', 'Triagem',         1),
  ('Dr. André Brites',  'a.brites@cho.min-saude.pt',  '$2b$12$demo_hash_andre',  'medico', 'M003', 'Medicina Interna',2);

-- Triagem urgente (amarelo) — Ana Ferreira → Hospital 1
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade,
                      resumo_ia, tempo_espera_min, estado)
VALUES (1, 1, 'amarelo', 3,
        'Utente do sexo feminino, 34 anos, refere dor torácica moderada com início há 2h, sem irradiação. Sem antecedentes cardíacos. Sinais vitais estáveis. Recomenda-se avaliação clínica dentro de 60 minutos.',
        45, 'em_espera');

INSERT INTO respostas_questionario (triagem_id, pergunta, resposta, ordem) VALUES
  (1, 'Qual é o seu principal sintoma?',         'Dor no peito',                    1),
  (1, 'Há quanto tempo tem este sintoma?',        'Cerca de 2 horas',                2),
  (1, 'Classifique a dor de 0 a 10.',             '6',                               3),
  (1, 'A dor irradia para outro local?',          'Não',                             4),
  (1, 'Tem dificuldade em respirar?',             'Ligeira',                         5),
  (1, 'Tem febre?',                               'Não',                             6),
  (1, 'Tem alguma doença crónica conhecida?',     'Não',                             7);

INSERT INTO fila_espera (triagem_id, hospital_id, posicao, estado) VALUES (1, 1, 1, 'aguardar');

-- Triagem não urgente (verde) — João Costa → autocuidado / Hospital 2
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade,
                      resumo_ia, conselhos_autocuidado, tempo_espera_min, estado)
VALUES (2, 2, 'verde', 4,
        'Utente do sexo masculino, 48 anos, refere dor de cabeça leve há 1 dia e congestão nasal. Sem febre. Quadro compatível com infeção respiratória superior.',
        'Recomenda-se repouso, ingestão de líquidos abundante e paracetamol 1g de 8 em 8 horas conforme necessidade. Se os sintomas piorarem ou surgir febre acima de 38,5 °C, recorra à urgência.',
        120, 'em_espera');

INSERT INTO respostas_questionario (triagem_id, pergunta, resposta, ordem) VALUES
  (2, 'Qual é o seu principal sintoma?',         'Dor de cabeça e nariz entupido',   1),
  (2, 'Há quanto tempo tem este sintoma?',        '1 dia',                            2),
  (2, 'Tem febre?',                               'Não',                             3),
  (2, 'Tem dificuldade em respirar?',             'Não',                             4),
  (2, 'Tomou algum medicamento?',                 'Não',                             5);

INSERT INTO fila_espera (triagem_id, hospital_id, posicao, estado) VALUES (2, 2, 1, 'aguardar');

-- Check-in da Ana Ferreira (secretaria Carla)
INSERT INTO checkins (triagem_id, secretaria_id, metodo_checkin, dados_cartao)
VALUES (1, 4, 'manual', '{"nr_cc":"12345678 0 ZZ8","nome":"Ana Ferreira","validade":"2030-01-01"}');

-- Consulta aberta para a Ana Ferreira
INSERT INTO consultas (triagem_id, medico_id, fila_id, estado, gabinete, iniciada_em)
VALUES (1, 6, 1, 'em_curso', 'Gabinete 2', strftime('%Y-%m-%dT%H:%M:%fZ','now'));

-- Logs de exemplo
INSERT INTO logs_auditoria (utilizador_id, acao, tabela_afetada, registo_id, detalhes) VALUES
  (1, 'TRIAGEM_CRIADA',    'triagens',     1, '{"cor":"amarelo","hospital_id":1}'),
  (4, 'CHECKIN_FEITO',     'checkins',     1, '{"metodo":"manual","triagem_id":1}'),
  (6, 'CONSULTA_INICIADA', 'consultas',    1, '{"gabinete":"Gabinete 2"}'),
  (2, 'TRIAGEM_CRIADA',    'triagens',     2, '{"cor":"verde","hospital_id":2}');

-- =============================================================
-- VISTAS ÚTEIS PARA O PROTÓTIPO
-- =============================================================

-- Painel do médico: fila ordenada por prioridade
CREATE VIEW IF NOT EXISTS v_painel_medico AS
SELECT
    f.posicao,
    t.cor_manchester,
    t.nivel_prioridade,
    u.nome              AS nome_utente,
    u.data_nascimento,
    t.resumo_ia,
    t.tempo_espera_min,
    f.estado            AS estado_fila,
    t.criado_em         AS hora_triagem,
    f.hospital_id
FROM fila_espera f
JOIN triagens    t ON t.id = f.triagem_id
JOIN utilizadores u ON u.id = t.utente_id
WHERE f.estado IN ('aguardar','chamado')
ORDER BY t.nivel_prioridade ASC, t.criado_em ASC;

-- Dashboard de lotação hospitalar
CREATE VIEW IF NOT EXISTS v_lotacao_hospitais AS
SELECT
    h.id,
    h.nome,
    h.cidade,
    h.lotacao_atual,
    h.capacidade_urgencia,
    ROUND(100.0 * h.lotacao_atual / h.capacidade_urgencia, 1) AS pct_ocupacao,
    COUNT(f.id) AS utentes_em_fila
FROM hospitais h
LEFT JOIN fila_espera f ON f.hospital_id = h.id AND f.estado = 'aguardar'
WHERE h.ativo = 1
GROUP BY h.id;

-- Histórico completo de uma triagem (útil para debug / HL7 FHIR export)
CREATE VIEW IF NOT EXISTS v_triagem_completa AS
SELECT
    t.id            AS triagem_id,
    u.nome          AS utente,
    u.nr_utente,
    h.nome          AS hospital,
    t.cor_manchester,
    t.nivel_prioridade,
    t.resumo_ia,
    t.conselhos_autocuidado,
    t.tempo_espera_min,
    t.estado,
    t.criado_em,
    ck.criado_em    AS checkin_em,
    c.estado        AS estado_consulta,
    c.notas_clinicas,
    c.diagnostico,
    c.finalizada_em
FROM triagens t
JOIN utilizadores u ON u.id = t.utente_id
LEFT JOIN hospitais  h  ON h.id  = t.hospital_id
LEFT JOIN checkins   ck ON ck.triagem_id = t.id
LEFT JOIN consultas  c  ON c.triagem_id  = t.id;