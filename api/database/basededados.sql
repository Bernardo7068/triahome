-- =============================================================
-- TRIA-Home · Esquema SQLite Multi-Hospital & Admin (FULL TEST DATA)
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
-- 1. HOSPITAIS
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
-- 2. UTILIZADORES
-- -------------------------------------------------------------
CREATE TABLE utilizadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('utente','secretaria','medico','admin')),
    nr_utente TEXT UNIQUE,
    nr_funcionario TEXT UNIQUE,
    especialidade TEXT,
    hospital_id INTEGER REFERENCES hospitais(id) ON DELETE SET NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    idade INTEGER,
    altura INTEGER,
    morada TEXT,
    descricao TEXT
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
-- 6. VIEW: PAINEL MEDICO (Com filtro de hospital_id)
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
-- 7. DADOS DE TESTE REAIS
-- -------------------------------------------------------------

-- 7.1 HOSPITAIS
INSERT INTO hospitais (id, nome, morada, cidade, telefone) VALUES 
(1, 'Hospital de Ourém', 'Rua da Saúde, 123', 'Ourém', '249111222'),
(2, 'Hospital de Leiria', 'Perto do Estádio, s/n', 'Leiria', '244333444'),
(3, 'Hospital de Santarém', 'Av. Central, 50', 'Santarém', '243555666');

-- 7.2 ADMIN E STAFF
-- Todos usam a password encriptada para 'password'
INSERT INTO utilizadores (id, nome, email, password_hash, role) 
VALUES (1, 'Administrador Geral', 'admin@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Staff Hospital 1 (Ourém)
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_funcionario, hospital_id) 
VALUES (2, 'Carla Secretaria (Ourém)', 'carla@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretaria', 'SEC001', 1);
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_funcionario, especialidade, hospital_id) 
VALUES (3, 'Dr. Bernardo (Ourém)', 'bernardo@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medico', 'MED001', 'Clínica Geral', 1);

-- Staff Hospital 2 (Leiria)
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_funcionario, hospital_id) 
VALUES (4, 'Sónia Secretaria (Leiria)', 'sonia@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretaria', 'SEC002', 2);
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_funcionario, especialidade, hospital_id) 
VALUES (5, 'Dra. Helena (Leiria)', 'helena@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medico', 'MED002', 'Traumatologia', 2);

-- 7.3 UTENTES
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_utente) VALUES 
(6, 'Ana Ferreira', 'ana@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '111222333'),
(7, 'Tiago Mendes', 'tiago@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '444555666'),
(8, 'João Silva', 'joao@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '777888999'),
(9, 'Inês Rodrigues', 'ines@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '999000111'),
(10, 'Marta Costa', 'marta@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '222333444');

-- 7.4 CENÁRIOS DE TRIAGEM

-- OURÉM: Ana (Pendente), Tiago (Validar), João (Em Espera - Prioritário)
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade, resumo_ia, estado) VALUES 
(6, 1, 'amarelo', 3, 'Gripe forte e febre persistente.', 'pendente'),
(7, 1, 'verde', 4, 'Dor no joelho após exercício.', 'checkin_feito'),
(8, 1, 'laranja', 2, 'Dificuldade respiratória e dor no peito.', 'em_espera');

-- Adiciona João à Fila de Espera de Ourém
INSERT INTO fila_espera (triagem_id, hospital_id, posicao, estado) VALUES (3, 1, 1, 'aguardar');

-- LEIRIA: Inês (Pendente), Marta (Em Espera)
INSERT INTO triagens (utente_id, hospital_id, cor_manchester, nivel_prioridade, resumo_ia, estado) VALUES 
(9, 2, 'vermelho', 1, 'Paragem cardiorrespiratória iminente.', 'pendente'),
(10, 2, 'amarelo', 3, 'Possível fratura no braço.', 'em_espera');

-- Adiciona Marta à Fila de Espera de Leiria
INSERT INTO fila_espera (triagem_id, hospital_id, posicao, estado) VALUES (5, 2, 1, 'aguardar');