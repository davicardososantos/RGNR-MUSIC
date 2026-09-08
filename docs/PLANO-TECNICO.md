# Plano técnico — Escala MUSIC

**Versão:** 1.1 (MVP entregue)
**Data:** 08/09/2026
**Base:** [PRD.md](PRD.md) v0.5
**Repositório:** `c:\Programação\RGNR-MUSIC`

---

## 1. Stack

| Camada | Escolha | Versão |
|---|---|---|
| Framework | Next.js — App Router, Server Actions | 16.x |
| Linguagem | TypeScript | 5.x |
| Estilo | Tailwind CSS + shadcn/ui | 4.x |
| Banco | Supabase (Postgres) | — |
| Auth | Supabase Auth — magic link, só gestores | — |
| Hospedagem | **Vercel** | — |
| Gerenciador | **npm** | 10.x |

> *Mudou na execução:* o plano dizia pnpm. A máquina só tinha npm, e instalar um gerenciador global para um projeto de um dev não se paga. O Supabase CLI entrou como dependência de desenvolvimento (`npm i -D supabase`), sem instalação global.

### Domínio

- **Agora:** `rgnr-music.vercel.app`
- **Depois:** `rgnr-music.codetrix.com.br` — `CNAME` para `cname.vercel-dns.com`, certificado emitido pelo próprio Vercel. Se o DNS do `codetrix.com.br` estiver no Cloudflare, deixar o registro como **DNS only** (nuvem cinza) para o Vercel conseguir validar.

Mudar de domínio **não toca em código** — é configuração no painel.

---

## 2. Estrutura do projeto

```
rgnr-music/
├ app/
│  ├ page.tsx                          → redireciona para /setembro
│  ├ setembro/
│  │  ├ page.tsx                       → formulário do músico
│  │  └ encerrado/page.tsx             → "respostas encerradas"
│  ├ admin/
│  │  ├ layout.tsx                     → guarda de sessão + allowlist
│  │  ├ page.tsx                       → painel do mês
│  │  ├ respostas/page.tsx             → quem respondeu / cobrança
│  │  └ evento/[data]/
│  │     ├ page.tsx                    → montar a escala
│  │     └ cobertura/page.tsx          → plano B ao vivo
│  ├ login/page.tsx
│  └ auth/callback/route.ts            → troca do magic link por sessão
│
├ actions/
│  ├ disponibilidade.ts                → salvar/editar resposta do músico
│  └ escala.ts                         → escalar, substituir, publicar
│
├ lib/
│  ├ supabase/
│  │  ├ service.ts                     → client service-role (SÓ servidor)
│  │  └ sessao.ts                      → sessão do gestor + allowlist
│  ├ regras.ts                         ← motor de validação da escala
│  ├ candidatos.ts                     ← quem pode ocupar cada função
│  ├ dados-escala.ts                   → carrega tudo da tela de escala
│  ├ chave-edicao.ts                   → §5 do PRD
│  ├ whatsapp.ts                       → monta as mensagens prontas
│  └ tipos.ts                          → gerado do schema
│
├ components/
│  ├ formulario/  CartaoData · SeletorNome · PassoDados
│  ├ escala/      Montador · SeletorMusico · PainelChecagem · Cobertura
│  ├ admin/       FormLogin · LinhaMusico
│  └ ui/          shadcn
│
├ supabase/
│  ├ migrations/20260908120000_schema.sql
│  └ seed.sql                          ← 37 do elenco, 36 no formulário
│
└ scripts/
   ├ validar-seed.mjs                  → confere o seed antes de subir
   ├ testar-conexao.mjs                → prova o RLS deny-all
   ├ conferir-elenco.mjs               → imprime o elenco do banco
   └ testar-escala.mts                 → exercita candidatos e checklist
```

---

## 3. Schema

### 3.1 Tipos

```sql
create type nivel_tecnico as enum ('top','avancado','bom','intermediario','iniciante');

create type status_musico as enum (
  'ativo',          -- ✅
  'presenca_baixa', -- 🕐
  'destreinado',    -- 💤
  'em_avaliacao',   -- 🎓
  'em_formacao',    -- 🧪
  'restricao',      -- ⛔
  'fora',           -- 📤
  'lideranca'       -- 👔
);

create type nivel_presenca as enum ('alta','media','baixa','so_na_escala','ausente','sob_demanda');

create type ordem_escala as enum (
  'primeira_linha','segunda_linha','terceira_linha',
  'carta_na_manga','reserva','formacao','indisponivel'
);

create type tipo_evento   as enum ('culto','fire','kids','especial');
create type status_evento as enum ('rascunho','publicada','fechada');
create type resposta_disp as enum ('sim','se_precisar','nao');
create type tipo_escalacao as enum ('titular','plano_b');
```

### 3.2 Elenco

```sql
create table instrumentos (
  id                text primary key,      -- 'baixo','bateria','cajon','teclado','guitarra','violao'
  nome              text not null,
  emoji             text,
  ordem_criticidade int  not null          -- 1 = função que menos perdoa erro
);

create table musicos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  slug          text not null unique,
  whatsapp      text,
  status        status_musico  not null default 'ativo',
  presenca      nivel_presenca,
  frentes       text[]         not null default '{}',   -- culto, fire, kids, classic, vocal
  eh_lider      boolean        not null default false,
  nota          text,
  no_formulario boolean        not null default true,   -- D6: false só para o Pr. Anderson
  criado_em     timestamptz    not null default now(),
  atualizado_em timestamptz    not null default now()
);

-- nível é POR INSTRUMENTO, não por pessoa (criterios-de-nivel.md)
create table musico_instrumento (
  musico_id      uuid  references musicos on delete cascade,
  instrumento_id text  references instrumentos,
  nivel          nivel_tecnico,          -- anulável: o elenco tem "—" e "A avaliar"
  principal      boolean       not null default false,
  ordem          ordem_escala  not null default 'reserva',
  observacao     text,
  ativo          boolean       not null default true,  -- false = o músico tirou no formulário
  primary key (musico_id, instrumento_id)
);
```

### 3.3 Funções e formações

```sql
create table funcoes (
  id    text primary key,   -- 'teclado_base','baixo','guitarra_1','violao',...
  nome  text not null,
  emoji text
);

-- uma função pode aceitar mais de um instrumento:
-- 'bateria' → bateria + cajon
create table funcao_instrumentos (
  funcao_id      text references funcoes on delete cascade,
  instrumento_id text references instrumentos,
  primary key (funcao_id, instrumento_id)
);

-- qual formação cada tipo de evento usa (regras-de-escala.md §1)
create table formacao (
  tipo                tipo_evento not null,
  funcao_id           text references funcoes,
  obrigatoria         boolean not null default false,
  plano_b_obrigatorio boolean not null default false,
  ordem               int not null,          -- ordem de preenchimento: baixo primeiro
  primary key (tipo, funcao_id)
);
```

### 3.4 Eventos e disponibilidade

```sql
create table eventos (
  id                   uuid primary key default gen_random_uuid(),
  data                 date not null unique,
  tipo                 tipo_evento not null,
  titulo               text,                    -- 'Culto de Santa Ceia'
  hora_evento          time not null,
  hora_passagem        time,
  exigencia_alta       boolean not null default false,
  -- D11: os dois campos abaixo são INDEPENDENTES de propósito.
  prazo_resposta       date,      -- só texto exibido ("responda até 09/09")
  aberto_para_resposta boolean not null default true,  -- o gate de verdade, no botão do gestor
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

-- §5 do PRD: chave de edição por dispositivo
create table chaves_edicao (
  id         uuid primary key default gen_random_uuid(),
  musico_id  uuid not null references musicos on delete cascade,
  token_hash text not null unique,
  criado_em  timestamptz not null default now(),
  ultimo_uso timestamptz
);

-- histórico completo + detecção de resposta de outro dispositivo
create table disponibilidade_log (
  id               bigserial primary key,
  musico_id        uuid not null references musicos on delete cascade,
  evento_id        uuid not null references eventos on delete cascade,
  resposta         resposta_disp not null,
  passagem_som     boolean,
  observacao       text,
  chave_conhecida  boolean not null,   -- false = ⚠️ respondeu de outro aparelho
  criado_em        timestamptz not null default now()
);
```

### 3.5 Escala

```sql
create table escalacoes (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos on delete cascade,
  funcao_id     text not null references funcoes,
  musico_id     uuid not null references musicos,
  tipo          tipo_escalacao not null default 'titular',
  confirmado    boolean not null default false,
  justificativa text,                       -- obrigatória ao fechar contra uma regra
  substituiu    uuid references musicos,    -- histórico de troca
  motivo_troca  text,
  criado_por    text,
  criado_em     timestamptz not null default now(),
  unique (evento_id, funcao_id, tipo)       -- 1 titular + 1 plano B por função
);

create table admins (
  email text primary key,
  nome  text not null
);
```

### 3.6 Segurança — RLS deny-all

Decisão do PRD §9: **nada acessa o banco direto do navegador.**

```sql
alter table musicos             enable row level security;
alter table musico_instrumento  enable row level security;
alter table eventos             enable row level security;
alter table disponibilidades    enable row level security;
alter table disponibilidade_log enable row level security;
alter table chaves_edicao       enable row level security;
alter table escalacoes          enable row level security;
alter table admins              enable row level security;
-- nenhuma policy criada de propósito:
-- anon e authenticated não leem nada. Só o service role (servidor) passa.
```

Isso satisfaz a D7 (privacidade) por construção, não por acerto de política. Mesmo que a `NEXT_PUBLIC_SUPABASE_ANON_KEY` vaze, ela não lê a disponibilidade de ninguém.

---

## 4. Seed

`supabase/seed.sql` foi **transcrito à mão** do `elenco.md` e do `por-instrumento.md`.

> *Mudou na execução:* o plano previa um `scripts/gerar-seed.ts` que fizesse o parse dos Markdown. Descartado. É trabalho de uma vez só para 37 pessoas, e o parser erraria justamente onde dói: os níveis compostos (`Top · Bom (baixo)`, `Intermediário · Bom (violão)`, `A avaliar`, `—`). Um parser descartável que produz nível errado é pior que digitação conferida.

| Fonte | Vira |
|---|---|
| Tabela do `elenco.md` | `musicos` — nome, status, presença, frentes, nota |
| Tabelas do `por-instrumento.md` | `musico_instrumento` — nível e ordem de escala por instrumento |

**Ainda precisa de conferência do Davi.** 37 músicos, 46 relações músico×instrumento.

**Fora do formulário:** só `Pr. Anderson` → `no_formulario = false`. Restam 36.

### Formações (seed fixo)

Os dois tipos usam as **mesmas 9 posições**. O que muda é a obrigatoriedade.

```
posição         ordem   culto        fire
baixo             1     obrig+planoB obrig
bateria           2     obrig        obrig     (aceita cajon)
teclado_base      3     obrig        obrig
guitarra_1        4     obrig        —
violao            5     —            —
guitarra_2        6     —            —
teclado_aux       7     —            —
click_vs          8     obrig        —         (sai com a bateria)
comunicacao       9     obrig        —
```

Revisto em 08/09: o Fire tinha 4 posições próprias, o mínimo do
`regras-de-escala.md`. Mas o Fire às vezes monta banda completa, e o
violão no culto nem sempre entra. Mínimo virou obrigatoriedade, não limite.

A `ordem` segue a ordem de decisão do `regras-de-escala.md` §5: **baixo primeiro, bateria depois.**

---

## 5. As duas peças de lógica que importam

Todo o resto é CRUD. Estas duas são o produto.

### 5.1 `lib/candidatos.ts` — quem pode ocupar uma função

```ts
type Candidato = {
  musico: Musico
  nivel: NivelTecnico          // no instrumento DESTA função
  ordem: OrdemEscala           // 1ª linha, 2ª linha, ...
  presenca: NivelPresenca
  observacao?: string          // o que ele escreveu no formulário
  avisos: Aviso[]              // ver abaixo
}

type Grupos = {
  disponiveis:  Candidato[]    // ✅ respondeu "Sim"
  sePrecisar:   Candidato[]    // 🤝
  naoPodem:     Candidato[]    // ❌  (recolhido na UI)
  semResposta:  Candidato[]    // ⋯   (recolhido, cinza)
}

export function candidatosParaFuncao(ctx: {
  funcao: Funcao
  evento: Evento
  musicos: MusicoComInstrumentos[]
  disponibilidades: Disponibilidade[]
  escalacoesAtuais: Escalacao[]
}): Grupos
```

**Filtro:** só quem tem `musico_instrumento` para algum instrumento aceito pela função.
**Ordenação dentro de cada grupo:** `ordem` (1ª linha → reserva) → `nivel` → `presenca`.

**Avisos por candidato:**

| Aviso | Quando |
|---|---|
| `ja_escalado` | Já está em outra função **deste** evento. *É a "trava do André Lima" — regra geral, não caso especial* |
| `nao_passa_som` | Marcou disponível mas não consegue chegar na passagem |
| `destreinado` | Status 💤 e evento é culto |
| `em_formacao` | Status 🧪 e evento é culto |
| `em_avaliacao` | Status 🎓 — Matheus Ventura (D10) |
| `lideranca` | Status 👔 — Sebastião (D10) |
| `presenca_baixa` | 🕐 ou "só na escala" → pede confirmação dupla |
| `restricao` | ⛔ — **não entra na lista, nunca** |

**Inversão no Fire:** quando `evento.tipo = 'fire'`, `em_formacao` e `destreinado` deixam de ser aviso e viram **destaque positivo** — "candidato a estreia". É o `frentes.md`: o Fire é o laboratório.

### 5.2 `lib/regras.ts` — o painel de checagem

```ts
type Checagem = {
  id: string
  titulo: string
  estado: 'ok' | 'aviso' | 'erro' | 'nao_aplicavel'
  mensagem: string
}

export function checarEscala(ctx: {
  evento: Evento
  escalacoes: EscalacaoComMusico[]
  formacao: ItemFormacao[]
}): Checagem[]
```

| # | Checagem | Origem | Estado se falhar |
|---|---|---|---|
| 1 | Função obrigatória vazia | regras §1 | **erro** |
| 2 | Âncora (Top/Avançado) na base rítmica — bateria + baixo | regras §2.1 | erro |
| 3 | Âncora nas harmonias — teclado + guitarra/violão | regras §2.1 | erro |
| 4 | Nenhum iniciante sem cobertura de nível superior | regras §2.2 | erro |
| 5 | Plano B de baixo nomeado | regras §4.2 | erro *(só culto)* |
| 6 | Baixo é Bom ou acima | por-instrumento | erro *(só se `exigencia_alta`)* |
| 7 | Ninguém 4º culto seguido na mesma função | regras §4.1 | aviso *(inativa até o histórico existir — §8 fase 6)* |
| 8 | Pelo menos um líder fora do palco | regras §4.4 | aviso |
| 9 | Ninguém com status ⛔ | regras §2.6 | **erro** |
| 10 | Ninguém em duas funções críticas | regras §4.3 | aviso *(exceto bateria + click/VS)* |
| 11 | Todos conseguem passar som | regras §3.5 | aviso |

**Erro não bloqueia — pede justificativa.** Publicar uma escala com checagem em erro abre um campo de texto obrigatório, gravado em `escalacoes.justificativa`. É a regra da casa: *"escalar baixo abaixo de Bom é risco consciente"*. O sistema registra a consciência.

---

## 6. Rotas

| Rota | Acesso | O que faz |
|---|---|---|
| `/` | público | → `/setembro` |
| `/setembro` | público | Formulário, 4 passos |
| `/setembro/encerrado` | público | Respostas fechadas — **sem exibir dado** (D7) |
| `/login` | público | Magic link |
| `/auth/callback` | — | Troca o link por sessão, valida allowlist |
| `/admin` | gestor | Painel do mês, 6 cartões |
| `/admin/respostas` | gestor | Quem respondeu · cobrança WhatsApp |
| `/admin/evento/[data]` | gestor | **Montar a escala** |
| `/admin/evento/[data]/cobertura` | gestor | Quem pode cobrir quando alguém cai |

**Guarda do `/admin`:** `layout.tsx` valida sessão + e-mail na tabela `admins`. E-mail fora da allowlist → 404, não 403 (não confirma que a área existe).

---

## 7. Server Actions

```ts
// actions/disponibilidade.ts
salvarResposta({ musicoSlug, eventoId, resposta, passagemSom, observacao })
  → grava disponibilidades (upsert) + disponibilidade_log
  → se a chave de edição do cookie não bater: chave_conhecida = false ⚠️
carregarMinhasRespostas(musicoSlug)
  → SÓ retorna dados se o cookie tiver a chave daquele músico (§5). Senão: vazio
confirmarDados({ musicoSlug, whatsapp, instrumentos })

// actions/escala.ts
escalar({ eventoId, funcaoId, musicoId, tipo })
desescalar({ escalacaoId })
substituir({ escalacaoId, novoMusicoId, motivo })
publicarEscala({ eventoId, justificativa? })
encerrarRespostas({ eventoId })
```

Todas checam sessão de gestor, exceto as três primeiras.

---

## 8. Ordem de implementação

> **Prioridade absoluta:** o formulário. O 11/09 é daqui a 3 dias e nada acontece antes das respostas chegarem.

### Fase 0 — Fundação
- `create-next-app` + Tailwind + shadcn
- Projeto no Supabase, `20260908120000_schema.sql`, seed gerado e **conferido a olho**
- Deploy vazio no Vercel funcionando
- ✅ *Entregável: `rgnr-music.vercel.app` no ar*

### Fase 1 — Formulário ← **o que trava tudo**
- `/setembro`: seletor de nome → dados → 6 cartões → confirmação
- Chave de edição (cookie httpOnly + hash no banco)
- Salvamento parcial por data
- Tela de encerrado
- ✅ *Entregável: **o link pra mandar no grupo***

### Fase 2 — Acesso e cobrança
- Magic link + allowlist (Davi, André)
- `/admin` painel do mês
- `/admin/respostas` + botões de WhatsApp
- ✅ *Entregável: você acompanha quem respondeu e cobra quem falta*

### Fase 3 — Montar a escala
- `lib/candidatos.ts` e `lib/regras.ts`
- `/admin/evento/[data]` com seletor agrupado e painel de checagem
- Formações culto × fire
- ✅ *Entregável: escala do 12/09 (Santa Ceia) fechada no sistema*

### Fase 4 — Cobertura
- `/admin/evento/[data]/cobertura`
- Substituição com registro de motivo
- ✅ *Entregável: a tela do "fulano caiu, e agora"*

### ~~Fase 5~~ — cortada

Decisão do Davi em 08/09: o MVP termina na Fase 4. Ficaram de fora a página
pública da escala (`/escala/[data]`), o export em Markdown e o ping semanal.

**Duas consequências que ficam registradas, não resolvidas:**

| Item | Situação |
|---|---|
| **Backup** | A D8 aposentou o `2026-09.md` do Obsidian, e o export que substituiria não foi feito. A escala existe **só no Supabase**. Perder o projeto é perder a escala |
| **Pausa do free tier** | O Supabase pausa projeto sem atividade por alguns dias. Com uso mensal, pode acontecer entre um mês e outro. Não é perda de dados — é despausar no painel, mas o formulário fica fora do ar até alguém perceber |

Nenhuma das duas impede o uso de setembro. Ambas são de 15 minutos de
trabalho quando incomodarem.

### Depois do MVP

Histórico automático de participação (destrava a checagem do 4º culto
seguido), confirmação do escalado pelo próprio link, recorrência de eventos.

---

## 9. Variáveis de ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # não lê nada (RLS deny-all) — só auth
SUPABASE_SERVICE_ROLE_KEY=          # ⚠️ SÓ servidor. Nunca em componente client
NEXT_PUBLIC_SITE_URL=https://rgnr-music.vercel.app   # callback do magic link
CRON_SECRET=                        # protege a rota de ping
```

> `SUPABASE_SERVICE_ROLE_KEY` só é importada em `lib/supabase/service.ts`, que leva `import 'server-only'` no topo. Se alguém tentar usar num componente client, o build quebra — que é o comportamento desejado.

---

## 10. Deploy

1. Repositório no GitHub → importar no Vercel
2. Env vars no painel (as 5 acima)
3. Push na `main` = produção. Branch = preview automático
4. **Domínio próprio, quando quiser:** `CNAME rgnr-music → cname.vercel-dns.com` no DNS do `codetrix.com.br`, adicionar em Vercel → Settings → Domains. Atualizar `NEXT_PUBLIC_SITE_URL` e a URL de callback no Supabase Auth

---

## 11. Pendências que viram tarefa

| # | Item | Onde entra |
|---|---|---|
| P1 | E-mail do André Santos | Seed de `admins` |
| P2 | Passagem de som do culto: 15h ou 14h30 | `eventos.hora_passagem` — campo editável |

*Resolvido:* prazo = **quarta, 09/09**, apenas como texto. `aberto_para_resposta` fica `true` (D11).

---

## 12. Nota de implementação — a D11 na prática

Nunca derivar `aberto_para_resposta` de `prazo_resposta`. Sem job, sem cron, sem `if (hoje > prazo)`. O formulário fecha **só** quando o gestor aperta o botão.

Uma consequência a implementar junto: quando chega resposta de um evento que **já tem escalação montada**, marcar para o gestor.

```sql
-- resposta que chegou depois da escala do evento já existir
select d.* from disponibilidades d
where d.evento_id = $1
  and d.atualizado_em > (
    select min(criado_em) from escalacoes where evento_id = $1
  );
```

Aparece como 🆕 na `/admin/respostas`. Se o Léo (Top, guitarra) responde na quinta e você fechou a escala na quarta com a segunda linha, isso é informação que muda decisão — e sem o marcador ela se perde.
