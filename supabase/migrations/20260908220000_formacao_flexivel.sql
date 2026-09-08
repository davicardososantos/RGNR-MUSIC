-- O Fire passa a ter as mesmas posições do culto, e o violão deixa de ser
-- obrigatório no sábado.
--
-- O desenho anterior travava o Fire em 4 posições ("teclado, violão OU
-- guitarra, baixo, bateria/cajon"), que é o mínimo do regras-de-escala.md.
-- Mas na prática o Fire às vezes monta banda completa: dois teclados, duas
-- guitarras, violão, baixo e bateria. Mínimo não é limite.
--
-- Agora os dois tipos usam as mesmas 9 posições, e o que muda é só o que
-- conta como obrigatório no checklist:
--   culto — baixo, bateria, teclado, guitarra 1, click/VS e comunicação
--   fire  — baixo, bateria e teclado
--
-- Nada disso bloqueia (D12). "Obrigatória" só acende um item da checagem.

-- ------------------------------------------------------------
-- 1. Bateria passa a aceitar cajon
--    O cajon era exclusivo da posição de ritmo do Fire, que deixa de
--    existir. João Ygor e Arely continuam aparecendo como candidatos.
-- ------------------------------------------------------------

insert into funcao_instrumentos (funcao_id, instrumento_id)
values ('bateria', 'cajon')
on conflict do nothing;

-- ------------------------------------------------------------
-- 2. Violão deixa de ser obrigatório no culto
-- ------------------------------------------------------------

update formacao set obrigatoria = false
where tipo = 'culto' and funcao_id = 'violao';

-- ------------------------------------------------------------
-- 3. Fire ganha as mesmas posições do culto
-- ------------------------------------------------------------

delete from formacao where tipo = 'fire';

insert into formacao (tipo, funcao_id, obrigatoria, plano_b_obrigatorio, ordem) values
  ('fire', 'baixo',        true,  false, 1),
  ('fire', 'bateria',      true,  false, 2),
  ('fire', 'teclado_base', true,  false, 3),
  ('fire', 'guitarra_1',   false, false, 4),
  ('fire', 'violao',       false, false, 5),
  ('fire', 'guitarra_2',   false, false, 6),
  ('fire', 'teclado_aux',  false, false, 7),
  ('fire', 'click_vs',     false, false, 8),
  ('fire', 'comunicacao',  false, false, 9);

-- ------------------------------------------------------------
-- 4. Aposenta as posições exclusivas do Fire
-- ------------------------------------------------------------

delete from funcao_instrumentos
where funcao_id in ('teclado_fire', 'harmonia_fire', 'ritmo_fire');

delete from funcoes
where id in ('teclado_fire', 'harmonia_fire', 'ritmo_fire');
