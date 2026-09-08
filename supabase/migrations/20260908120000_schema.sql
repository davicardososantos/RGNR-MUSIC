-- ============================================================
-- Escala MUSIC — schema inicial
-- Base: docs/PRD.md v0.4 · docs/PLANO-TECNICO.md v1.0
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tipos
-- ------------------------------------------------------------

create type nivel_tecnico as enum ('top','avancado','bom','intermediario','iniciante');

create type status_musico as enum (
  'ativo',          -- ✅ entra no rodízio normal
  'presenca_baixa', -- 🕐 só com confirmação antecipada
  'destreinado',    -- 💤 tem o nível, precisa de retomada
  'em_avaliacao',   -- 🎓 audição / processo de entrada
  'em_formacao',    -- 🧪 estreando em Fire/Kids
  'restricao',      -- ⛔ não escalar
  'fora',           -- 📤 no grupo, mas não é escalado
  'lideranca'       -- 👔 aparece por função, não por escala
);

create type nivel_presenca as enum ('alta','media','baixa','so_na_escala','ausente','sob_demanda');

create type ordem_escala as enum (
  'primeira_linha','segunda_linha','terceira_linha',
  'carta_na_manga','reserva','formacao','indisponivel'
);

create type tipo_evento    as enum ('culto','fire','kids','especial');
create type status_evento  as enum ('rascunho','publicada','fechada');
create type resposta_disp  as enum ('sim','se_precisar','nao');
create type tipo_escalacao as enum ('titular','plano_b');

-- ------------------------------------------------------------
-- 2. Elenco
-- ------------------------------------------------------------

create table instrumentos (
  id                text primary key,
  nome              text not null,
  emoji             text,
  ordem_criticidade int  not null   -- 1 = a função que menos perdoa erro
);

create table musicos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  slug          text not null unique,
  whatsapp      text,
  status        status_musico  not null default 'ativo',
  presenca      nivel_presenca,
  frentes       text[]         not null default '{}',
  eh_lider      boolean        not null default false,
  nota          text,
  -- D6: false apenas para o Pr. Anderson (⛔). Os outros 36 recebem o formulário
  no_formulario boolean        not null default true,
  criado_em     timestamptz    not null default now(),
  atualizado_em timestamptz    not null default now()
);

-- O nível é POR INSTRUMENTO, não por pessoa (criterios-de-nivel.md).
-- nivel é anulável de propósito: o elenco tem "—" e "A avaliar".
create table musico_instrumento (
  musico_id      uuid references musicos on delete cascade,
  instrumento_id text references instrumentos,
  nivel          nivel_tecnico,
  principal      boolean      not null default false,
  ordem          ordem_escala not null default 'reserva',
  observacao     text,
  primary key (musico_id, instrumento_id)
);

-- ------------------------------------------------------------
-- 3. Funções e formações
-- ------------------------------------------------------------

create table funcoes (
  id    text primary key,
  nome  text not null,
  emoji text
);

-- Uma função pode aceitar mais de um instrumento:
-- harmonia_fire → violão OU guitarra · ritmo_fire → bateria OU cajon
create table funcao_instrumentos (
  funcao_id      text references funcoes on delete cascade,
  instrumento_id text references instrumentos,
  primary key (funcao_id, instrumento_id)
);

-- Qual formação cada tipo de evento usa (regras-de-escala.md §1)
create table formacao (
  tipo                tipo_evento not null,
  funcao_id           text references funcoes,
  obrigatoria         boolean not null default false,
  plano_b_obrigatorio boolean not null default false,
  ordem               int not null,  -- ordem de decisão: baixo primeiro (regras §5)
  primary key (tipo, funcao_id)
);

-- Override da ordem de escala por FUNÇÃO.
-- Existe por causa de casos como o Samuel: 2ª linha no teclado base,
-- mas 1ª linha no teclado auxiliar. Sem linha aqui, vale musico_instrumento.ordem.
create table musico_funcao_ordem (
  musico_id uuid references musicos on delete cascade,
  funcao_id text references funcoes on delete cascade,
  ordem     ordem_escala not null,
  primary key (musico_id, funcao_id)
);

-- ------------------------------------------------------------
-- 4. Eventos e disponibilidade
-- ------------------------------------------------------------

create table eventos (
  id                   uuid primary key default gen_random_uuid(),
  data                 date not null unique,
  tipo                 tipo_evento not null,
  titulo               text,
  hora_evento          time not null,
  hora_passagem        time,
  exigencia_alta       boolean not null default false,
  -- D11: prazo_resposta é SÓ TEXTO. Quem fecha o formulário é
  -- aberto_para_resposta, no botão do gestor. Nunca derivar um do outro.
  prazo_resposta       date,
  aberto_para_resposta boolean not null default true,
  status               status_evento not null default 'rascunho',
  criado_em            timestamptz not null default now()
);

create table disponibilidades (
  id            uuid primary key default gen_random_uuid(),
  musico_id     uuid not null references musicos on delete cascade,
  evento_id     uuid not null references eventos on delete cascade,
  resposta      resposta_disp not null,
  passagem_som  boolean not null default false,
  observacao    text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (musico_id, evento_id)
);

create index on disponibilidades (evento_id);

-- PRD §5: chave de edição por dispositivo.
-- Sem a chave, selecionar um nome devolve formulário em branco —
-- ninguém lê a disponibilidade de outra pessoa.
create table chaves_edicao (
  id         uuid primary key default gen_random_uuid(),
  musico_id  uuid not null references musicos on delete cascade,
  token_hash text not null unique,
  criado_em  timestamptz not null default now(),
  ultimo_uso timestamptz
);

create index on chaves_edicao (musico_id);

create table disponibilidade_log (
  id              bigserial primary key,
  musico_id       uuid not null references musicos on delete cascade,
  evento_id       uuid not null references eventos on delete cascade,
  resposta        resposta_disp not null,
  passagem_som    boolean,
  observacao      text,
  chave_conhecida boolean not null,  -- false = ⚠️ respondeu de outro aparelho
  criado_em       timestamptz not null default now()
);

create index on disponibilidade_log (evento_id, musico_id);

-- ------------------------------------------------------------
-- 5. Escala
-- ------------------------------------------------------------

create table escalacoes (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos on delete cascade,
  funcao_id     text not null references funcoes,
  musico_id     uuid not null references musicos,
  tipo          tipo_escalacao not null default 'titular',
  confirmado    boolean not null default false,
  justificativa text,                     -- obrigatória ao publicar contra uma regra
  substituiu    uuid references musicos,
  motivo_troca  text,
  criado_por    text,
  criado_em     timestamptz not null default now(),
  unique (evento_id, funcao_id, tipo)     -- 1 titular + 1 plano B por função
);

create index on escalacoes (evento_id);

create table admins (
  email text primary key,
  nome  text not null
);

-- ------------------------------------------------------------
-- 6. Segurança — RLS deny-all (PRD §9)
-- Nenhuma policy é criada de propósito: anon e authenticated não leem
-- nada. Todo acesso passa pelo servidor com a service role.
-- Isso satisfaz a D7 (privacidade) por construção.
-- ------------------------------------------------------------

alter table instrumentos         enable row level security;
alter table musicos              enable row level security;
alter table musico_instrumento   enable row level security;
alter table funcoes              enable row level security;
alter table funcao_instrumentos  enable row level security;
alter table formacao             enable row level security;
alter table musico_funcao_ordem  enable row level security;
alter table eventos              enable row level security;
alter table disponibilidades     enable row level security;
alter table chaves_edicao        enable row level security;
alter table disponibilidade_log  enable row level security;
alter table escalacoes           enable row level security;
alter table admins               enable row level security;

-- ------------------------------------------------------------
-- 7. Dados de referência (parte do contrato do app, não do elenco)
-- ------------------------------------------------------------

insert into instrumentos (id, nome, emoji, ordem_criticidade) values
  ('baixo',    'Baixo',    '🎸', 1),
  ('teclado',  'Teclado',  '🎹', 2),
  ('bateria',  'Bateria',  '🥁', 3),
  ('guitarra', 'Guitarra', '🎸', 4),
  ('violao',   'Violão',   '🎸', 5),
  ('cajon',    'Cajon',    '🥁', 6);

insert into funcoes (id, nome, emoji) values
  -- Culto
  ('baixo',          'Baixo',             '🎸'),
  ('bateria',        'Bateria',           '🥁'),
  ('teclado_base',   'Teclado base',      '🎹'),
  ('teclado_aux',    'Teclado auxiliar',  '🎹'),
  ('guitarra_1',     'Guitarra 1',        '🎸'),
  ('guitarra_2',     'Guitarra 2',        '🎸'),
  ('violao',         'Violão',            '🎸'),
  ('click_vs',       'Click e VS',        '🔈'),
  ('comunicacao',    'Comunicação',       '🎤'),
  -- Fire (formação enxuta)
  ('teclado_fire',   'Teclado',           '🎹'),
  ('harmonia_fire',  'Violão ou Guitarra','🎸'),
  ('ritmo_fire',     'Bateria ou Cajon',  '🥁');

insert into funcao_instrumentos (funcao_id, instrumento_id) values
  ('baixo',         'baixo'),
  ('bateria',       'bateria'),
  ('teclado_base',  'teclado'),
  ('teclado_aux',   'teclado'),
  ('guitarra_1',    'guitarra'),
  ('guitarra_2',    'guitarra'),
  ('violao',        'violao'),
  ('click_vs',      'bateria'),
  ('teclado_fire',  'teclado'),
  ('harmonia_fire', 'violao'),
  ('harmonia_fire', 'guitarra'),
  ('ritmo_fire',    'bateria'),
  ('ritmo_fire',    'cajon');
-- comunicacao não tem instrumento: qualquer pessoa pode assumir

-- Formação do CULTO (9 funções) — ordem = ordem de decisão (regras §5):
-- baixo primeiro, bateria depois, teclado base, harmonias, o resto.
insert into formacao (tipo, funcao_id, obrigatoria, plano_b_obrigatorio, ordem) values
  ('culto', 'baixo',        true,  true,  1),
  ('culto', 'bateria',      true,  false, 2),
  ('culto', 'teclado_base', true,  false, 3),
  ('culto', 'guitarra_1',   true,  false, 4),
  ('culto', 'violao',       true,  false, 5),
  ('culto', 'guitarra_2',   false, false, 6),
  ('culto', 'teclado_aux',  false, false, 7),
  ('culto', 'click_vs',     true,  false, 8),
  ('culto', 'comunicacao',  true,  false, 9);

-- Formação do FIRE (4 funções) — "teclado, violão ou guitarra, baixo,
-- bateria/cajon". É onde músico novo estreia.
insert into formacao (tipo, funcao_id, obrigatoria, plano_b_obrigatorio, ordem) values
  ('fire', 'baixo',         true, false, 1),
  ('fire', 'ritmo_fire',    true, false, 2),
  ('fire', 'teclado_fire',  true, false, 3),
  ('fire', 'harmonia_fire', true, false, 4);
