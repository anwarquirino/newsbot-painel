-- Schema do NewsBot (n8n + IA + WordPress), reproduzido para o docker-compose do painel.
-- Em produção estas tabelas já existem no MySQL usado pelos fluxos do n8n.

CREATE DATABASE IF NOT EXISTS newsbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE newsbot;

CREATE TABLE IF NOT EXISTS noticias_publicadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(500) NOT NULL,
  url_original TEXT NOT NULL,
  hash CHAR(64) NOT NULL UNIQUE,
  status ENUM('fila', 'processando', 'publicado', 'erro') NOT NULL DEFAULT 'fila',
  post_id_wp INT NULL,
  fonte VARCHAR(100) NULL,
  resumo_fonte TEXT NULL,
  categoria_wp INT NULL,
  conteudo_reescrito MEDIUMTEXT NULL,
  resumo TEXT NULL,
  tags VARCHAR(500) NULL,
  categoria VARCHAR(100) NULL,
  data_coleta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_publicacao DATETIME NULL,
  tentativas TINYINT NOT NULL DEFAULT 0,
  erro_msg TEXT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS execucoes_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fluxo VARCHAR(100) NOT NULL,
  status ENUM('ok', 'erro') NOT NULL,
  mensagem TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
