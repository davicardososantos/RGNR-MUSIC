-- ------------------------------------------------------------
-- Área do músico (30/09/2026)
--
-- O formulário vira uma área com login: o músico entra com o WhatsApp e a
-- data de nascimento, vê as escalas publicadas, confirma presença e avisa
-- imprevisto. Decisões do Davi em 30/09/2026.
-- ------------------------------------------------------------

-- 1. Login -----------------------------------------------------

-- O telefone do Voluts serve SÓ para conferir o login de quem não tem
-- WhatsApp no app (12 pessoas em 30/09). Não aparece em tela nenhuma e
-- não substitui `whatsapp`, que continua sendo o que o músico informa.
alter table musicos
  add column if not exists telefone_voluts text,
  add column if not exists ultimo_acesso   timestamptz;

comment on column musicos.telefone_voluts is
  'Telefone do cadastro do Voluts, só dígitos. Usado apenas para conferir o login. Nunca exibido.';

-- Uma linha por aparelho logado. O cookie guarda o token; aqui fica só o
-- SHA-256, como em chaves_edicao.
create table if not exists sessoes_musico (
  id          uuid primary key default gen_random_uuid(),
  musico_id   uuid not null references musicos on delete cascade,
  token_hash  text not null unique,
  criado_em   timestamptz not null default now(),
  ultimo_uso  timestamptz not null default now()
);
create index if not exists sessoes_musico_musico_idx on sessoes_musico (musico_id);

-- Freio contra quem tenta adivinhar a data de nascimento de alguém:
-- o app conta os erros por telefone numa janela de tempo.
create table if not exists tentativas_entrada (
  id         bigserial primary key,
  telefone   text not null,
  ok         boolean not null,
  criado_em  timestamptz not null default now()
);
create index if not exists tentativas_entrada_telefone_idx on tentativas_entrada (telefone, criado_em);

-- 2. Escala vista pelo músico ----------------------------------

alter table escalacoes
  add column if not exists confirmado_em     timestamptz,
  add column if not exists imprevisto_em     timestamptz,
  add column if not exists imprevisto_texto  text;

comment on column escalacoes.imprevisto_em is
  'Quando o próprio músico avisou pela área dele que não vai mais poder. A escala não muda sozinha: quem troca é o gestor, na cobertura.';

-- 3. Segurança: mesma regra do resto do banco (PRD §9) -----------
-- RLS ligado e nenhuma policy: só o servidor, com a service role, lê e grava.
alter table sessoes_musico     enable row level security;
alter table tentativas_entrada enable row level security;
