-- Formação de Conferência e Atmosfera.
--
-- Vive numa migration separada de propósito: os valores 'conferencia' e
-- 'atmosfera' foram criados na anterior, e o Postgres não deixa usar um
-- valor de enum na mesma transação em que ele nasce.
--
-- Os dois tipos usam as mesmas 9 posições do culto — a diferença está no
-- que conta como obrigatório, seguindo a lógica já adotada em
-- 20260908220000_formacao_flexivel.sql. Nada disso bloqueia (D12):
-- "obrigatória" só acende um item do checklist.

-- Conferência — banda completa, mesmo peso do culto.
insert into formacao (tipo, funcao_id, obrigatoria, plano_b_obrigatorio, ordem) values
  ('conferencia', 'baixo',        true,  false, 1),
  ('conferencia', 'bateria',      true,  false, 2),
  ('conferencia', 'teclado_base', true,  false, 3),
  ('conferencia', 'guitarra_1',   false, false, 4),
  ('conferencia', 'violao',       false, false, 5),
  ('conferencia', 'guitarra_2',   false, false, 6),
  ('conferencia', 'teclado_aux',  false, false, 7),
  ('conferencia', 'click_vs',     false, false, 8),
  ('conferencia', 'comunicacao',  false, false, 9)
on conflict do nothing;

-- Atmosfera — momento à parte da conferência, banda menor.
-- Na prática de 05/09 rodou sem violão e sem comunicação.
insert into formacao (tipo, funcao_id, obrigatoria, plano_b_obrigatorio, ordem) values
  ('atmosfera', 'baixo',        true,  false, 1),
  ('atmosfera', 'bateria',      true,  false, 2),
  ('atmosfera', 'teclado_base', true,  false, 3),
  ('atmosfera', 'guitarra_1',   false, false, 4),
  ('atmosfera', 'violao',       false, false, 5),
  ('atmosfera', 'guitarra_2',   false, false, 6),
  ('atmosfera', 'teclado_aux',  false, false, 7),
  ('atmosfera', 'click_vs',     false, false, 8),
  ('atmosfera', 'comunicacao',  false, false, 9)
on conflict do nothing;
