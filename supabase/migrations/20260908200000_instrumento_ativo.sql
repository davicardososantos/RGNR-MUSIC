-- O músico pode tirar um instrumento da própria lista.
--
-- Antes, desmarcar não fazia nada: a linha ficava e voltava marcada na
-- próxima visita. O motivo era não perder o nível definido pela liderança
-- (Elias · baixo · top), mas o efeito era pior — o formulário mentia para
-- quem estava preenchendo.
--
-- Agora desmarcar apaga `ativo`, e o nível continua guardado. O músico vê
-- o que respondeu, e a liderança não perde a avaliação.

alter table musico_instrumento
  add column ativo boolean not null default true;

comment on column musico_instrumento.ativo is
  'false = o músico informou no formulário que não toca este instrumento. O nível é preservado para quando ele voltar.';
