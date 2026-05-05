-- =============================================================
-- TRIA-Home · Esquema SQLite Multi-Hospital & Admin
-- =============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- -------------------------------------------------------------
-- 0. LIMPEZA TOTAL
-- -------------------------------------------------------------
DROP VIEW IF EXISTS v_painel_medico;
DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS checkins;
DROP TABLE IF EXISTS fila_espera;
DROP TABLE IF EXISTS triagens;
DROP TABLE IF EXISTS utilizadores;
DROP TABLE IF EXISTS hospitais;

-- -------------------------------------------------------------
-- 1. HOSPITAIS (Expandido)
-- -------------------------------------------------------------
CREATE TABLE hospitais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    morada TEXT NOT NULL,
    cidade TEXT NOT NULL,
    telefone TEXT,
    capacidade_urgencia INTEGER NOT NULL DEFAULT 50,
    lotacao_atual INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 2. UTILIZADORES (Com Vínculo a Hospital)
-- -------------------------------------------------------------
CREATE TABLE utilizadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('utente','secretaria','medico','admin')),
    nr_utente TEXT UNIQUE,         -- Apenas para Utentes
    nr_funcionario TEXT UNIQUE,    -- Para Staff
    especialidade TEXT,            -- Para Médicos
    hospital_id INTEGER REFERENCES hospitais(id) ON DELETE SET NULL, -- Onde o funcionário trabalha
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 3. TRIAGENS
-- -------------------------------------------------------------
CREATE TABLE triagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    cor_manchester TEXT CHECK(cor_manchester IN ('vermelho','laranja','amarelo','verde','azul','branco')),
    nivel_prioridade INTEGER CHECK(nivel_prioridade BETWEEN 1 AND 5),
    resumo_ia TEXT,
    estado TEXT NOT NULL DEFAULT 'pendente' 
        CHECK(estado IN ('pendente','checkin_feito','em_espera','finalizado','cancelado')),
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 4. FILA_ESPERA
-- -------------------------------------------------------------
CREATE TABLE fila_espera (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id INTEGER NOT NULL UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    posicao INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'aguardar' 
        CHECK(estado IN ('aguardar','chamado','em_consulta','concluido')),
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- -------------------------------------------------------------
-- 5. CONSULTAS
-- -------------------------------------------------------------
CREATE TABLE consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    triagem_id INTEGER NOT NULL UNIQUE REFERENCES triagens(id) ON DELETE CASCADE,
    medico_id INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
    utente_id INTEGER REFERENCES utilizadores(id) ON DELETE SET NULL,
    hospital_id INTEGER REFERENCES hospitais(id),
    diagnostico TEXT,
    prescricao TEXT,
    data_consulta DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 6. VIEW: PAINEL MEDICO (Crucial para o filtro de hospital)
-- -------------------------------------------------------------
CREATE VIEW v_painel_medico AS
SELECT 
    t.id AS triagem_id,
    t.hospital_id,
    t.utente_id,
    u.nome AS nome_utente,
    t.cor_manchester,
    t.nivel_prioridade,
    t.resumo_ia,
    t.estado AS estado_triagem,
    f.estado AS estado_fila,
    f.posicao
FROM triagens t
JOIN utilizadores u ON t.utente_id = u.id
LEFT JOIN fila_espera f ON t.id = f.triagem_id;

-- -------------------------------------------------------------
-- 7. DADOS DE TESTE (Hospitais, Staff e Admin)
-- -------------------------------------------------------------

-- Inserção de Hospitais
INSERT INTO hospitais (nome, morada, cidade, telefone) VALUES 
('Hospital de Ourém', 'Rua da Saúde, 123', 'Ourém', '249000111'),
('Hospital de Leiria', 'Perto do Estádio, s/n', 'Leiria', '244000222'),
('Hospital de Santarém', 'Av. Central, 50', 'Santarém', '243000333');

-- Admin do Sistema (Gere tudo)
INSERT INTO utilizadores (nome, email, password_hash, role) 
VALUES ('Administrador Geral', 'admin@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Staff de Ourém (Hospital ID: 1)
INSERT INTO utilizadores (nome, email, password_hash, role, nr_funcionario, hospital_id) 
VALUES ('Carla (Secretaria Ourém)', 'carla@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretaria', 'SEC001', 1);

INSERT INTO utilizadores (nome, email, password_hash, role, nr_funcionario, especialidade, hospital_id) 
VALUES ('Dr. Bernardo (Ourém)', 'bernardo@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medico', 'MED001', 'Urgência', 1);

-- Staff de Leiria (Hospital ID: 2)
INSERT INTO utilizadores (nome, email, password_hash, role, nr_funcionario, hospital_id) 
VALUES ('Sónia (Secretaria Leiria)', 'sonia@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretaria', 'SEC002', 2);

-- Utente de Teste (Ana)
INSERT INTO utilizadores (nome, email, password_hash, role, nr_utente) 
VALUES ('Ana Ferreira', 'ana@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '111222333');

-- Triagem ativa da Ana enviada para Ourém (Hospital 1)
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade, resumo_ia, estado) 
VALUES (6, 1, 'amarelo', 3, 'Gripe forte e febre persistente.', 'pendente');