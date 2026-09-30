-- ------------------------------------------------------------
-- Cadastro do Voluts na ficha do músico (30/09/2026)
--
-- O Voluts (web.voluts.com.br) é onde a igreja guarda o cadastro de todo
-- voluntário do RGNR. A pedido do Davi, o que ele tem a mais sobre cada
-- músico passa a morar aqui também, e aparece só na ficha do painel.
--
-- Regras combinadas com o Davi:
--   * `nome` continua sendo o apelido que aparece no formulário. O nome do
--     Voluts vai para `nome_completo`.
--   * Telefone NÃO vem do Voluts: `whatsapp` é o que o músico informa aqui.
--   * As funções do Voluts ficam só guardadas. Não mexem em
--     `musico_instrumento`, que é o que conta para a escala.
--   * Quem preenche é o script de sincronização da liderança, lendo o
--     Voluts. Nada aqui é digitado pelo músico.
-- ------------------------------------------------------------

alter table musicos
  add column if not exists voluts_id              text unique,
  add column if not exists nome_completo          text,
  add column if not exists apelido_voluts         text,
  add column if not exists email                  text,
  add column if not exists aniversario            date,
  add column if not exists genero                 text,
  add column if not exists estado_civil           text,
  add column if not exists escolaridade           text,
  add column if not exists formacao               text,
  add column if not exists profissao              text,
  add column if not exists redes_sociais          jsonb,
  add column if not exists foto_url               text,
  add column if not exists funcoes_voluts         text[] not null default '{}',
  add column if not exists dias_voluts            text[] not null default '{}',
  add column if not exists ultima_escala_voluts   timestamptz,
  add column if not exists voluts_sincronizado_em timestamptz;

comment on column musicos.voluts_id is
  'Id do voluntário no Voluts. Liga o apelido do app ao cadastro de nome completo.';
comment on column musicos.genero is
  'Código do Voluts: MALE, FEMALE.';
comment on column musicos.estado_civil is
  'Código do Voluts: SINGLE, MARRIED, OTHERS.';
comment on column musicos.escolaridade is
  'Código do Voluts: FUNDAMENTAL, MEDIUM, GRADUATION, POST_GRADUATION.';
comment on column musicos.redes_sociais is
  'Do Voluts: {"instagram": "...", "facebook": "...", "linkedin": "..."}, só o que estiver preenchido.';
comment on column musicos.dias_voluts is
  'weekDaysAvailability do Voluts, um código por item: SAT-24, SUN-12... O número é a hora em que o turno acaba (12, 18, 24).';
comment on column musicos.ultima_escala_voluts is
  'lastVolunteering do Voluts: a última vez em que a pessoa foi escalada lá, em qualquer ministério.';
