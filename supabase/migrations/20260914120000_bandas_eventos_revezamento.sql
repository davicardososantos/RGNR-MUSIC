-- Registrar as escalas que já aconteceram trouxe quatro casos que o schema
-- atual não comportava. Nenhum deles é hipótese: todos vieram de setembro/2026.
--
--   1. Dois eventos no mesmo dia — 05/09 teve a Conferência à noite e o
--      Atmosfera à tarde. `eventos.data` era unique.
--   2. Revezamento — no Atmosfera, Raphael e Gabriel dividiram a bateria.
--      `escalacoes` só aceitava 1 titular por função.
--   3. Conferência e Atmosfera não existiam como tipo de evento.
--   4. A banda J Rapha (da Débora Miranda, vice-presidente) apoia os cultos
--      de ceia. Sem marcação de origem, esses músicos entrariam no rodízio
--      do MUSIC como se fossem do elenco.

-- ------------------------------------------------------------
-- 1. Origem do músico
--    'music' é o elenco. Quem vem de fora não entra no rodízio nem
--    recebe formulário — aparece só no histórico da escala.
-- ------------------------------------------------------------

create type banda_origem as enum ('music', 'j_rapha', 'convidado');

alter table musicos
  add column banda banda_origem not null default 'music';

comment on column musicos.banda is
  'Origem do músico. Só ''music'' entra no rodízio de escala; os demais são apoio externo e aparecem apenas no histórico.';

create index musicos_banda_idx on musicos (banda);

-- ------------------------------------------------------------
-- 2. Novos tipos de evento
--    ATENÇÃO: no Postgres, um valor novo de enum não pode ser USADO na
--    mesma transação em que é criado. Por isso os dados entram depois,
--    em passo separado — nunca junte insert de evento a esta migration.
-- ------------------------------------------------------------

alter type tipo_evento add value if not exists 'conferencia';
alter type tipo_evento add value if not exists 'atmosfera';

-- ------------------------------------------------------------
-- 3. Mais de um evento por dia
--    Continua protegido contra duplicata do MESMO evento, mas o dia
--    deixa de ser exclusivo.
-- ------------------------------------------------------------

alter table eventos drop constraint if exists eventos_data_key;

alter table eventos
  add constraint eventos_data_tipo_unico unique (data, tipo);

-- ------------------------------------------------------------
-- 4. Revezamento na mesma função
--    Antes: 1 titular + 1 plano B por função (unique evento+função+tipo).
--    Agora: a mesma pessoa não se repete na mesma função, mas duas
--    pessoas podem dividir a posição. O porquê vai em `observacao`.
-- ------------------------------------------------------------

alter table escalacoes
  drop constraint if exists escalacoes_evento_id_funcao_id_tipo_key;

alter table escalacoes
  add constraint escalacoes_evento_funcao_musico_unico
  unique (evento_id, funcao_id, musico_id);

alter table escalacoes
  add column observacao text;

comment on column escalacoes.observacao is
  'Contexto da escalação — ex.: "revezou com o Gabriel", "entrou no lugar do X no dia".';
