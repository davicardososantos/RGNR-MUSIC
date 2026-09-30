# Escala MUSIC — Banda RGNR

Ferramenta de disponibilidade e escala da Banda do MUSIC (ministério de música do RGNR / IPDA).
Dois gestores (Davi e André Santos) montam a escala; 37 músicos informam disponibilidade.

**Leia antes de mexer:** [docs/PRD.md](docs/PRD.md) e [docs/PLANO-TECNICO.md](docs/PLANO-TECNICO.md).

**Estado:** MVP no ar em `rgnr-music.vercel.app`. Fases 0 a 4 entregues.
A Fase 5 (página pública da escala, export em Markdown, ping contra a pausa
do Supabase) foi cortada — as duas últimas ficaram como risco em aberto,
registrado no PRD §9.

## Comandos

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run typecheck  # next typegen && tsc --noEmit
npm run lint
```

> `npx tsc --noEmit` sozinho falha: o Next 16 gera `LayoutProps`/`PageProps` em
> `.next/types`. Use `npm run typecheck`, que roda o `next typegen` antes.

## Virada de mês

Um passo só:

```bash
node scripts/criar-eventos-do-mes.mjs 2026-12            # confere
node scripts/criar-eventos-do-mes.mjs 2026-12 --aplicar  # grava
```

O script cria sexta = Fire e sábado = Culto, com o segundo sábado como Culto
de Santa Ceia. Criar os eventos já põe o mês no ar: o formulário é uma página
só, na raiz, e mostra todas as datas abertas de hoje em diante. O que fugir do
padrão (conferência, Atmosfera, Kids) entra à mão depois.

**Não crie rota nova por mês.** `/setembro`, `/outubro` e `/novembro` são
redirecionamentos para a raiz e só existem porque esses links já foram colados
no WhatsApp.

O mês anterior não é fechado nesse momento. Quem fecha uma data é sempre o
botão do painel, em `aberto_para_resposta` (D11).

## Invariantes do projeto

Estas regras vêm do PRD e não devem ser quebradas sem mudar o PRD antes.

1. **Nada acessa o banco do navegador.** O schema tem RLS deny-all e zero policies.
   Todo acesso passa por Server Action usando `lib/supabase/service.ts`.
2. **Músico nunca vê disponibilidade de outro** (D7). Selecionar um nome sem a
   chave de edição do dispositivo devolve formulário em branco, nunca dados.
3. **`prazo_resposta` é só texto** (D11). Quem fecha o formulário é
   `aberto_para_resposta`, no botão do gestor. Nunca derivar um do outro.
4. **Nível é por instrumento, não por pessoa.** Quem toca três instrumentos tem
   três níveis. Vive em `musico_instrumento`.
5. **Nenhuma regra de negócio nomeia uma pessoa.** A "trava do André Lima"
   (violão ou baixo, nunca os dois) é a regra genérica `ja_escalado`.
6. **O app informa, não restringe** (D12). O checklist é uma lista visível,
   nunca um portão: nada impede fechar uma escala e nada pede justificativa.
   Ninguém é escondido de uma função por não tocar o instrumento — aparece
   atrás de um clique, marcado. A resposta do músico vale mais que o
   documento, porque o documento é um retrato de 30/08 e a resposta é de hoje.
7. **Culto e Fire usam as mesmas 9 posições.** O que muda é quais contam como
   obrigatórias no checklist: o culto exige 6, o Fire só baixo, bateria e
   teclado. No Fire, status "em formação" é destaque positivo, não aviso — é
   o laboratório de estreia.
8. **Nada de emoji na interface.** Todo ícone vem do Font Awesome, através de
   `components/icone.tsx`. Ver abaixo.
9. **O formulário é uma página só** (17/09/2026), hoje em `/formulario`; a
   raiz virou a área do músico em 30/09/2026 (ver abaixo). Ele mostra todas as datas
   abertas de hoje em diante, agrupadas por mês. Antes havia uma rota por mês,
   e quem quisesse responder outubro e novembro tinha de achar o próprio nome
   e conferir os instrumentos duas vezes — era o maior atrito para responder.
10. **Ajuste de resposta pelo gestor exige motivo**, e é a única coisa
    obrigatória do painel. Não contradiz a D12: ali o gestor fala no lugar de
    outra pessoa. Ver PRD §5.1.

## Área do músico (desde 30/09/2026)

A raiz (`/`) deixou de ser o formulário: é a **área do músico**, com login.
Código em `components/area/`, `lib/area/` e `actions/area.ts`; tabelas na
migration `20260930180000_area_do_musico`.

- **Entrar:** WhatsApp + data de nascimento (decisão do Davi). O número
  confere com `musicos.whatsapp` ou com `musicos.telefone_voluts` (escondido,
  só para login). Cinco erros no mesmo número travam por 15 minutos
  (`tentativas_entrada`). A sessão é um cookie de um ano (`rgnr_sessao`),
  com o SHA-256 em `sessoes_musico`.
- **O músico nunca vê de onde vem o dado.** Foto, nome completo e aniversário
  vêm do Voluts, mas a área não cita o Voluts em lugar nenhum (pedido do Davi).
  Nem no código da página: a foto passa por `app/foto/[id]` (só com sessão de
  músico ou gestor), porque o endereço de origem tem "voluts" no caminho.
- **Escala só aparece publicada** (`eventos.status = 'publicada'`, botão
  "Publicar escala" em `/admin/evento/[data]`). Rascunho é só dos gestores.
- **Confirmar e avisar imprevisto** gravam em `escalacoes` (`confirmado_em`,
  `imprevisto_em`, `imprevisto_texto`). Imprevisto aparece no painel, na
  montagem e na cobertura; a escala não muda sozinha.
- **Resposta rápida:** um cartão por data (arrastar direita = sim, esquerda =
  não, cima = se precisar; setas no computador). "Chego na passagem" vem
  ligado: sem isso toda resposta chegaria como "não passa o som".
- **O formulário antigo** segue em `/formulario`, sem link na área, como
  reserva para quem não consegue entrar. `/setembro`, `/outubro` e
  `/novembro` continuam levando para a raiz.
- **App na tela do celular:** `app/manifest.ts` e `public/icone-*.png`.
- Movimentos próprios em `globals.css` (`area-*`), desligados com
  `prefers-reduced-motion`.

## Painel dos gestores (desde 30/09/2026)

O `/admin` usa o mesmo idioma visual da área do músico. Moldura em
`components/painel/casca.tsx` (menu lateral no computador; no celular, abas
embaixo e "Mais"); peças em `components/painel/ui.tsx` (`Cabecalho`,
`Numero`, `Secao`, `Medidor`, `Selo`, `Rosto`); dados do dashboard em
`lib/dados-painel.ts`.

- **Gráficos são SVG/HTML próprios**, sem biblioteca, em
  `components/painel/graficos/`. As cores seguem o método de dataviz e foram
  validadas no script dele: sim `#7fa328` (a lima da marca um degrau abaixo,
  porque `#cef955` fica clara demais como marca de gráfico no fundo escuro),
  se precisar `#8c69cc`, não em cinza neutro. O mapa de cobertura usa uma rampa
  de um tom só (`RAMPA`). Todo gráfico tem legenda, balão no mouse e no foco do
  teclado, e o valor também aparece em texto: o balão enfeita, não esconde.
- No mapa, "0" em vermelho é buraco de verdade; data que ninguém respondeu
  ainda fica neutra, porque é cedo, não é falta.
- `lib/supabase/service.ts` tenta de novo (até 3 vezes) as falhas passageiras do
  banco: 401 em qualquer método, 5xx/429/rede só em leitura. `app/error.tsx`
  mostra "Tentar de novo" em vez do 500 cru.

## Histórico importado (30/09/2026)

As escalas de **jul/2025 a ago/2026** (81 datas, 574 escalações) vieram dos posts de formação do
grupo de WhatsApp "RGNR | Multimídia". Os eventos antigos estão como `fechada`, sem
disponibilidade; as escalações têm `criado_por = 'importado: grupo Multimídia (30/09/2026)'`.
13 ex-membros entraram com `status = 'fora'` e `no_formulario = false`: aparecem no histórico e em
Pessoas ("Já tocaram com a banda"), nunca no formulário, na área ou na cobrança. Os scripts ficam
fora do repo, no vault da liderança.

- Por isso **"disse sim × tocou" usa `tocouNoPeriodo`**: só as datas com formulário (desde
  set/2026). Comparar "sim" com 14 meses de "tocou" faria todo mundo parecer escalado demais.
- A ficha mostra só as datas passadas que dizem respeito à pessoa (tocou ou respondeu).

## Cadastro do Voluts

Desde 30/09/2026, `musicos` tem as colunas do Voluts (`voluts_id`, `nome_completo`,
`email`, `aniversario`, `funcoes_voluts`, `dias_voluts`...), mostradas só na ficha do
painel (`components/admin/cadastro-voluts.tsx`). Quem preenche é um script da
liderança que lê o Voluts com o login do gestor e **não fica neste repositório**.
O app só lê essas colunas. `nome` continua sendo o apelido do formulário, o
telefone do Voluts vai só para `telefone_voluts` (login, nunca exibido) e as
funções de lá não mexem em `musico_instrumento`.

## Ícones

Emoji na interface está proibido neste projeto. Motivos, na ordem que importa:

1. Dá cara de coisa gerada por IA — foi o motivo do pedido
2. Renderiza diferente em cada sistema (Android, iOS e Windows desenham outro boneco)
3. Não herda `currentColor`: não dá para tingir de lima ou roxo
4. Não alinha com a linha de base do texto nem escala com a tipografia

**Como usar:**

```tsx
import { Icone } from '@/components/icone'

<Icone nome="sim" className="h-4 w-4" />
```

**Como adicionar um ícone novo:** importe de `@fortawesome/free-solid-svg-icons`
em `components/icone.tsx` e registre no objeto `ICONES` com um nome **do
domínio**, não do desenho — `sePrecisar`, não `faHandshakeAngle`. O resto do
app nunca importa Font Awesome direto.

**Onde não usar ícone:** quando o rótulo ao lado já diz a mesma coisa. Os
botões de instrumento são só texto de propósito — baixo, guitarra e violão
cairiam todos no mesmo desenho de violão do Font Awesome, e o nome já resolve.

## Escrita

O texto da interface é lido por 37 pessoas da igreja, no celular. Português
direto, sem jargão de produto. **Não usar travessão (—) em texto de interface:**
é cacoete de IA. Duas frases curtas, ou uma vírgula.

## Fonte das regras

As regras de escala não foram inventadas aqui. Elas vêm de
`C:\Users\davic\Documents\RGNR\MUSIC\lideranca\` (Obsidian):
`regras-de-escala.md`, `criterios-de-nivel.md`, `por-instrumento.md`, `frentes.md`.
Ao mudar uma regra no código, conferir se o documento também mudou.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
