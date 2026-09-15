CREATE DATABASE IF NOT EXISTS mesa_solidaria;

USE mesa_solidaria;


-- =========================================
-- 1. USUARIOS
-- =========================================

CREATE TABLE USUARIOS (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,

    nome_usuario VARCHAR(100) NOT NULL,

    cpf_usuario CHAR(11)
        CHARACTER SET ascii
        COLLATE ascii_bin
        UNIQUE,

    email_usuario VARCHAR(150)
        NOT NULL
        UNIQUE,

    senha_usuario VARCHAR(255)
        NOT NULL,

    status_usuario ENUM(
        'ATIVA',
        'INATIVA',
        'BLOQUEADA'
    )
    NOT NULL
    DEFAULT 'ATIVA',

    tentativas_invalidas INT
        NOT NULL
        DEFAULT 0,

    bloqueado_ate DATETIME,

    data_criacao DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    data_atualizacao DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================
-- 2. PERFIS
-- =========================================

CREATE TABLE PERFIS (
    id_perfil INT AUTO_INCREMENT PRIMARY KEY,

    nome_perfil VARCHAR(45)
        NOT NULL
        UNIQUE,

    descricao_perfil VARCHAR(150)
);


-- =========================================
-- 3. USUARIOS_PERFIS
-- =========================================

CREATE TABLE USUARIOS_PERFIS (
    id_usuario_perfil INT
        AUTO_INCREMENT
        PRIMARY KEY,

    id_usuario INT NOT NULL,

    id_perfil INT NOT NULL,

    perfil_principal TINYINT(1)
        NOT NULL
        DEFAULT 0,

    data_vinculo DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    status_vinculo ENUM(
        'ATIVO',
        'INATIVO'
    )
    NOT NULL
    DEFAULT 'ATIVO',

    CONSTRAINT uq_usuario_perfil
        UNIQUE (
            id_usuario,
            id_perfil
        ),

    CONSTRAINT fk_usuarios_perfis_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIOS(id_usuario),

    CONSTRAINT fk_usuarios_perfis_perfil
        FOREIGN KEY (id_perfil)
        REFERENCES PERFIS(id_perfil)
);


-- =========================================
-- 4. SESSOES
-- =========================================

CREATE TABLE SESSOES (
    id_sessao INT
        AUTO_INCREMENT
        PRIMARY KEY,

    id_usuario INT
        NOT NULL,

    id_perfil_ativo INT,

    token_hash CHAR(64)
        NOT NULL
        UNIQUE,

    data_inicio DATETIME
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    data_expiracao DATETIME
        NOT NULL,

    data_logout DATETIME,

    status_sessao ENUM(
        'ATIVA',
        'ENCERRADA',
        'REVOGADA',
        'EXPIRADA'
    )
    NOT NULL
    DEFAULT 'ATIVA',

    CONSTRAINT fk_sessoes_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES USUARIOS(id_usuario),

    CONSTRAINT fk_sessoes_usuario_perfil
        FOREIGN KEY (
            id_usuario,
            id_perfil_ativo
        )
        REFERENCES USUARIOS_PERFIS (
            id_usuario,
            id_perfil
        )
);


-- =========================================
-- PERFIS INICIAIS
-- =========================================

INSERT INTO PERFIS
(
    nome_perfil,
    descricao_perfil
)
VALUES
(
    'BENEFICIARIO',
    'Pessoa que recebe doaÃ§Ãµes'
),
(
    'DOADOR',
    'Pessoa ou organizaÃ§Ã£o que realiza doaÃ§Ãµes'
),
(
    'VOLUNTARIO',
    'Pessoa que participa de atividades voluntÃ¡rias'
),
(
    'PONTO_COLETA',
    'ResponsÃ¡vel por um ponto de coleta'
),
(
    'ADMINISTRADOR',
    'Administrador do sistema'
);
