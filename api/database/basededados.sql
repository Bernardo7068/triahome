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
    descricao TEXT,
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
    especialidade TEXT,
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
    u.nr_utente,
    u.idade,
    u.altura,
    u.morada,
    u.descricao AS descricao_utente,
    t.cor_manchester,
    t.nivel_prioridade,
    t.resumo_ia,
    t.especialidade,
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
INSERT INTO hospitais (id, nome, morada, cidade, telefone, capacidade_urgencia) VALUES 
(1, 'Hospital de Ourém', 'Rua da Saúde, 123', 'Ourém', '249111222', 50),
(2, 'Hospital de Leiria', 'Perto do Estádio, s/n', 'Leiria', '244333444', 120),
(3, 'Hospital de Santarém', 'Av. Central, 50', 'Santarém', '243555666', 80),
(4, 'Hospital de Coimbra', 'Rua Larga, UC', 'Coimbra', '239444555', 200),
(5, 'Hospital de Tomar', 'Alameda do Convento, 10', 'Tomar', '249321654', 40);

-- 7.2 ADMIN E STAFF
-- Todos usam a password encriptada para 'password'
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_funcionario, morada, descricao) 
VALUES (1, 'Administrador Geral', 'admin@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ADM001', 'Sede SNS, Lisboa', 'Administrador do Sistema');

-- Staff Hospital 1 (Ourém)
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_funcionario, hospital_id, idade, morada, descricao) 
VALUES (2, 'Carla Secretaria (Ourém)', 'carla@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretaria', 'SEC001', 1, 32, 'Rua das Flores, Ourém', 'Secretariado Ourém');

-- Staff Hospital 2 (Leiria)
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_funcionario, hospital_id, idade, morada, descricao) 
VALUES (3, 'Sónia Secretaria (Leiria)', 'sonia@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretaria', 'SEC002', 2, 29, 'Av. Marquês de Pombal, Leiria', 'Secretariado Leiria');

-- Exemplo de Médicos
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_funcionario, especialidade, hospital_id, idade, morada, descricao) VALUES
(10, 'Dr. Manuel Cardiologia (Ourém)', 'medico.cardiologia.h1@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medico', 'MED010', 'Cardiologia', 1, 45, 'Residência Médica Ourém', 'Especialista em Cardiologia'),
(11, 'Dra. Ana Pediatria (Leiria)', 'medico.pediatria.h2@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medico', 'MED011', 'Pediatria', 2, 38, 'Residência Médica Leiria', 'Especialista em Pediatria');

-- 7.3 UTENTES (Com perfil completo)
INSERT INTO utilizadores (id, nome, email, password_hash, role, nr_utente, idade, altura, morada, descricao) VALUES 
(500, 'Ana Maria Ferreira', 'ana@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '111222333', 28, 165, 'Rua das Camélias, 12, Ourém', 'Alergia a Penicilina. Histórico de Hipertensão controlada.'),
(501, 'Tiago André Mendes', 'tiago@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '444555666', 34, 182, 'Av. da Liberdade, 45, Leiria', 'Diabetes Tipo 2. Praticante de desporto regular.'),
(502, 'João Paulo Silva', 'joao@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '777888999', 52, 175, 'Rua do Comércio, Santarém', 'Fumador. Problemas respiratórios ligeiros no inverno.'),
(503, 'Inês Catarina Rodrigues', 'ines@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '999000111', 19, 160, 'Rua da Universidade, Coimbra', 'Asma infantil. Sem medicação atual.'),
(504, 'Marta Sofia Costa', 'marta@tria.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utente', '222333444', 67, 158, 'Largo do Coreto, Tomar', 'Osteoporose. Toma suplementação de Cálcio e Vitamina D.');

-- 7.4 CENÁRIOS DE TRIAGEM (Apenas exemplos)
INSERT INTO triagens (id, utente_id, hospital_id, cor_manchester, nivel_prioridade, resumo_ia, especialidade, estado) VALUES 
(1, 500, 1, 'amarelo', 3, 'Gripe forte e febre persistente.', 'Clínica Geral', 'pendente'),
(2, 501, 2, 'laranja', 2, 'Dificuldade respiratória intensa.', 'Pneumologia', 'em_espera');

INSERT INTO fila_espera (triagem_id, hospital_id, posicao, estado) VALUES (2, 2, 1, 'aguardar');
