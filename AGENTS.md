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
   🧪 em formação é destaque positivo, não aviso — é o laboratório de estreia.

## Fonte das regras

As regras de escala não foram inventadas aqui. Elas vêm de
`C:\Users\davic\Documents\RGNR\MUSIC\lideranca\` (Obsidian):
`regras-de-escala.md`, `criterios-de-nivel.md`, `por-instrumento.md`, `frentes.md`.
Ao mudar uma regra no código, conferir se o documento também mudou.
