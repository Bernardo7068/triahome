-- =============================================================
-- TRIA-Home · Esquema SQLite Definitivo (Reset & Clean)
-- =============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA encoding = 'UTF-8';

-- -------------------------------------------------------------
-- 0. LIMPEZA TOTAL (Apaga tudo para começar do zero)
-- -------------------------------------------------------------
DROP VIEW IF EXISTS v_painel_medico;
DROP TRIGGER IF EXISTS trg_triagem_update;
DROP TRIGGER IF EXISTS trg_triagem_libera_vaga;
DROP TRIGGER IF EXISTS trg_checkin_atualiza_triagem;
DROP TRIGGER IF EXISTS trg_consulta_finaliza_triagem;

DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS checkins;
DROP TABLE IF EXISTS fila_espera;
DROP TABLE IF EXISTS respostas_questionario;
DROP TABLE IF EXISTS triagens;
DROP TABLE IF EXISTS utilizadores;
DROP TABLE IF EXISTS hospitais;

-- -------------------------------------------------------------
-- 1. HOSPITAIS
-- -------------------------------------------------------------
CREATE TABLE hospitais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    morada TEXT NOT NULL,
    cidade TEXT NOT NULL,
    codigo_postal TEXT,
    telefone TEXT,
    capacidade_urgencia INTEGER NOT NULL DEFAULT 50,
    lotacao_atual INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 2. UTILIZADORES
-- -------------------------------------------------------------
CREATE TABLE utilizadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('utente','secretaria','medico','admin')),
    nr_utente TEXT UNIQUE,
    data_nascimento TEXT,
    genero TEXT CHECK(genero IN ('M','F','O','N/A')),
    telefone TEXT,
    nr_funcionario TEXT UNIQUE,
    especialidade TEXT,
    hospital_id INTEGER REFERENCES hospitais(id) ON DELETE SET NULL,
    ultimo_login TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 3. TRIAGENS
-- -------------------------------------------------------------
CREATE TABLE triagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES hospitais(id) ON DELETE SET NULL,
    cor_manchester TEXT CHECK(cor_manchester IN ('vermelho','laranja','amarelo','verde','azul','branco')),
    nivel_prioridade INTEGER CHECK(nivel_prioridade BETWEEN 1 AND 5),
    resumo_ia TEXT,
    conselhos_autocuidado TEXT,
    tempo_espera_min INTEGER,
    estado TEXT NOT NULL DEFAULT 'pendente' 
        CHECK(estado IN ('pendente','checkin_feito','em_espera','finalizado','cancelado')),
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 4. FILA_ESPERA (Apenas para quem a Secretaria Validou)
-- -------------------------------------------------------------
CREATE TABLE fila_espera (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id INTEGER NOT NULL UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    posicao INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'aguardar' 
        CHECK(estado IN ('aguardar','chamado','em_consulta','concluido')),
    chamado_em TEXT,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 5. CHECKINS
-- -------------------------------------------------------------
CREATE TABLE checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id INTEGER NOT NULL UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    secretaria_id INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
    metodo_checkin TEXT NOT NULL DEFAULT 'manual' CHECK(metodo_checkin IN ('manual','quiosque','rfid')),
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 6. CONSULTAS (Histórico Final do Médico)
-- -------------------------------------------------------------
CREATE TABLE consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id INTEGER NOT NULL UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    medico_id INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
    utente_id INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
    fila_id INTEGER REFERENCES fila_espera(id) ON DELETE SET NULL,
    estado TEXT NOT NULL DEFAULT 'aguardar_medico'
        CHECK(estado IN ('aguardar_medico','em_curso','finalizada','transferida')),
    gabinete TEXT,
    diagnostico TEXT,
    prescricao TEXT,
    notas_clinicas TEXT,
    data_consulta DATETIME DEFAULT CURRENT_TIMESTAMP,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 7. VIEW: PAINEL MEDICO (O Truque Mágico do LEFT JOIN)
-- -------------------------------------------------------------
CREATE VIEW v_painel_medico AS
SELECT 
    t.id AS triagem_id,
    t.utente_id,
    u.nome AS nome_utente,
    u.data_nascimento,
    t.cor_manchester,
    t.nivel_prioridade,
    t.resumo_ia,
    t.tempo_espera_min,
    t.estado AS estado_triagem,
    f.id AS fila_id,
    f.posicao,
    f.estado AS estado_fila
FROM triagens t
JOIN utilizadores u ON t.utente_id = u.id
LEFT JOIN fila_espera f ON t.id = f.triagem_id;

-- -------------------------------------------------------------
-- 8. TRIGGERS
-- -------------------------------------------------------------
CREATE TRIGGER trg_triagem_update
AFTER UPDATE ON triagens FOR EACH ROW
BEGIN
    UPDATE triagens SET atualizado_em = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id;
END;

CREATE TRIGGER trg_triagem_libera_vaga
AFTER UPDATE OF estado ON triagens FOR EACH ROW
WHEN NEW.estado IN ('finalizado','cancelado') AND OLD.estado NOT IN ('finalizado','cancelado')
BEGIN
    UPDATE hospitais SET lotacao_atual = MAX(0, lotacao_atual - 1) WHERE id = NEW.hospital_id;
END;

-- -------------------------------------------------------------
-- 9. DADOS DE TESTE (Para a tua Apresentação Funcionar Perfeita)
-- -------------------------------------------------------------

-- O Hospital
INSERT INTO hospitais (nome, morada, cidade, capacidade_urgencia, lotacao_atual) 
VALUES ('Hospital de Ourém', 'Rua da Saúde, 123', 'Ourém', 50, 4);

-- O Staff
INSERT INTO utilizadores (nome, email, password_hash, role, nr_funcionario) 
VALUES ('Carla (Secretaria)', 'secretaria@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretaria', 'SEC001');

INSERT INTO utilizadores (nome, email, password_hash, role, nr_funcionario, especialidade) 
VALUES ('Dr. Bernardo', 'medico@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medico', 'MED001', 'Medicina Geral');

-- Utente 1: Ana Ferreira (Aparece na Secretaria - "pendente")
INSERT INTO utilizadores (nome, email, password_hash, role, nr_utente) 
VALUES ('Ana Ferreira', 'ana@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '111222333');
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade, resumo_ia, tempo_espera_min, estado) 
VALUES (3, 1, 'amarelo', 3, 'Dor de cabeça intensa e febre 38.5. Fez triagem na App.', 60, 'pendente');

-- Utente 2: Tiago Mendes (Aparece na Secretaria - "checkin_feito" no quiosque)
INSERT INTO utilizadores (nome, email, password_hash, role, nr_utente) 
VALUES ('Tiago Mendes', 'tiago@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '444555666');
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade, resumo_ia, tempo_espera_min, estado) 
VALUES (4, 1, 'verde', 4, 'Dor no tornozelo após queda. Fez triagem no quiosque.', 120, 'checkin_feito');

-- Utente 3: João Silva (Aparece no Médico - Validado pela secretaria)
INSERT INTO utilizadores (nome, email, password_hash, role, nr_utente) 
VALUES ('João Silva', 'joao@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '777888999');
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade, resumo_ia, tempo_espera_min, estado) 
VALUES (5, 1, 'verde', 4, 'Tosse com expectoração há 1 semana.', 120, 'em_espera');
INSERT INTO fila_espera (triagem_id, hospital_id, posicao, estado) 
VALUES (3, 1, 1, 'aguardar');

-- Utente 4: Inês Rodrigues (Aparece no Médico - Validada e MUITO URGENTE)
INSERT INTO utilizadores (nome, email, password_hash, role, nr_utente) 
VALUES ('Inês Rodrigues', 'ines@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '999000111');
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade, resumo_ia, tempo_espera_min, estado) 
VALUES (6, 1, 'laranja', 2, 'Dor opressiva no peito e suores frios. Falta de ar.', 10, 'em_espera');
INSERT INTO fila_espera (triagem_id, hospital_id, posicao, estado) 
VALUES (4, 1, 2, 'aguardar');

-- A Password para todos os logins de teste criados acima é: password