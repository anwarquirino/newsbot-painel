-- Migration OPCIONAL do painel: adiciona o status 'descartado' ao ENUM de noticias_publicadas.
--
-- O que faz: permite que a ação "Descartar" do painel tire um item da fila sem apagá-lo,
-- preservando o histórico. O fluxo do n8n continua intacto, pois ele só consulta
-- status = 'fila' e nunca enxerga itens descartados.
--
-- Sem esta migration tudo funciona, exceto a ação "Descartar" (a API responde 409 MIGRATION_REQUIRED).
-- Para desfazer: execute o mesmo MODIFY sem 'descartado' (depois de reclassificar os itens descartados).

ALTER TABLE noticias_publicadas
  MODIFY status ENUM('fila', 'processando', 'publicado', 'erro', 'descartado') NOT NULL DEFAULT 'fila';
