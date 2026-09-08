# Escala MUSIC — Banda RGNR

Ferramenta de disponibilidade e escala da Banda do MUSIC (ministério de música do RGNR / IPDA).
Dois gestores (Davi e André Santos) montam a escala; ~36 músicos informam disponibilidade.

**Leia antes de mexer:** [docs/PRD.md](docs/PRD.md) e [docs/PLANO-TECNICO.md](docs/PLANO-TECNICO.md).

## Comandos

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run typecheck  # next typegen && tsc --noEmit
npm run lint
```

> `npx tsc --noEmit` sozinho falha: o Next 16 gera `LayoutProps`/`PageProps` em
> `.next/types`. Use `npm run typecheck`, que roda o `next typegen` antes.

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
6. **Alerta de regra não bloqueia** — pede justificativa, que fica gravada.
   A liderança pode fechar contra a regra conscientemente.
7. **Culto e Fire têm formações diferentes** (9 funções × 4). No Fire, status
   "em formação" é destaque positivo, não aviso — é o laboratório de estreia.
8. **Nada de emoji na interface.** Todo ícone vem do Font Awesome, através de
   `components/icone.tsx`. Ver abaixo.

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

O texto da interface é lido por 36 pessoas da igreja, no celular. Português
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
