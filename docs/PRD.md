# PRD — Escala MUSIC (Banda RGNR)

**Versão:** 0.4 (decisões fechadas · lista de nomes definida · prazo definido)
**Data:** 08/09/2026
**Autores:** Davi Cardoso · Claude
**Aprovadores:** Davi e André Santos (liderança da Banda)
**Status:** 🟢 pronto para revisão do André · pendências pontuais na §13

---

## 1. Contexto

O MUSIC é o ministério de música do RGNR (IPDA), dividido em três frentes: **Vocal**, **Banda** e **Classic**. A **Banda** é liderada por Davi e André Santos e tem **37 pessoas** no elenco, com níveis, presenças e status muito diferentes entre si.

Toda a inteligência da operação já existe e está documentada em `Documents/RGNR/MUSIC/lideranca/` — elenco, perfis, ordem de escala por instrumento, critérios de nível, regras de escala e histórico de participação. O problema **não é falta de critério**. É que o critério vive em Markdown e a disponibilidade vive no WhatsApp.

### O problema, em concreto

| Dor | Como é hoje |
|---|---|
| **Descobrir quem pode tocar** | Pergunta solta no grupo. Quem responde, responde; quem não responde, some no meio das mensagens |
| **Fechar a escala** | Abrir 4 arquivos (elenco, por-instrumento, regras, histórico) e cruzar de cabeça com quem respondeu |
| **Quando alguém cancela** | Recomeçar do zero: rolar o WhatsApp pra lembrar quem tinha dito que podia |
| **Plano B** | A regra manda nomear plano B de baixo em toda escala. Na prática, é memória |
| **Cobrar confirmação** | Manual, um a um, sem saber quem falta |

### Por que agora

Setembro/2026 está em aberto: a escala do mês tem só a Conferência de Jovens fechada, e o restante está como "⏳ a definir". Restam **6 datas** — 3 Fires e 3 cultos. É o ciclo perfeito para validar a ferramenta com uso real.

---

## 2. Objetivo

> **Transformar a coleta de disponibilidade e o fechamento da escala em uma operação de minutos, com as regras da casa embutidas na ferramenta.**

### Objetivos do MVP

1. **Coletar** a disponibilidade dos músicos para as 6 datas restantes de setembro, por um link no WhatsApp, em menos de 2 minutos de preenchimento.
2. **Montar** a escala de cada data numa tela única, vendo apenas quem realmente pode, na ordem de escala já definida pela liderança.
3. **Responder na hora** à pergunta "o Elias caiu, quem pode?" — sem rolar conversa.
4. **Alertar** automaticamente quando a escala violar as regras da casa.

### O que este MVP **não** é

Explicitamente **fora de escopo** nesta primeira entrega — cada item aqui é uma tentação real:

- ❌ Repertório, setlist, cifras, tons, áudios (continua no Obsidian)
- ❌ Gestão do Vocal e do Classic
- ❌ Notificação automática (push, e-mail, bot de WhatsApp)
- ❌ App nativo
- ❌ Histórico de participação automático e relatórios de rodízio
- ❌ Escala de outros meses / recorrência automática de eventos
- ❌ Perfil público do músico, chat, mural

> A régua para o MVP: **se não ajuda a fechar a escala de setembro, fica de fora.**

---

## 3. Usuários

| Papel | Quem | Quantos | Onde usa | O que faz |
|---|---|---|---|---|
| **Músico** | Elenco da Banda | **36** | Celular, pelo link do WhatsApp | Informa disponibilidade nas 6 datas |
| **Gestor** | Davi e André Santos | 2 | Celular e desktop | Monta, publica e ajusta a escala |

### Contexto de uso — importa para o design

- **O músico abre no celular, dentro do WhatsApp**, provavelmente à noite, provavelmente com pressa. Mobile-first não é preferência, é requisito. Se travar ou pedir cadastro, ele fecha.
- **O gestor monta a escala no desktop**, mas **consulta o plano B no celular**, muitas vezes com alguém cancelando em cima da hora. A tela de plano B precisa funcionar bem no celular.

---

## 4. Decisões de produto fechadas

| # | Decisão | Escolha | Por quê |
|---|---|---|---|
| D1 | **Identificação do músico** | Link público único + selecionar o próprio nome numa lista pré-carregada | Zero atrito = taxa de resposta |
| D2 | **Escala de resposta** | 3 estados: ✅ **Sim** · 🤝 **Se precisar** · ❌ **Não** | O "Se precisar" é o que alimenta o plano B. Sem ele, todo disponível parece igual |
| D3 | **Campos extras** | Instrumento principal + cobertura · Observação por data · Disponibilidade para passagem de som · WhatsApp | Ver §6.1 |
| D4 | **Acesso do gestor** | Login por e-mail (magic link), allowlist: Davi e André Santos | Sem senha circulando no WhatsApp; dá pra saber quem alterou o quê |
| D5 | **Público do formulário** | Só a **Banda**. Não vai para Vocal nem Classic | Escopo do MVP |
| D6 | **Quem recebe o formulário** | **O elenco inteiro — 36 dos 37.** Fora só o Pr. Anderson (⛔) | Ver D10 |
| D7 | **Privacidade** | Músico **nunca** vê a disponibilidade de outro — nem durante, nem depois | Ver §5 |
| D8 | **Fonte da verdade** | O sistema **substitui** o `escalas/2026/2026-09.md` do Obsidian | Um lugar só. Sem escala em dois lugares |
| D9 | **Hospedagem e domínio** | **Vercel.** `rgnr-music.vercel.app` agora → `rgnr-music.codetrix.com.br` depois (CNAME) | Host e domínio são decisões separadas. O domínio próprio já existe e entra quando quiser, sem mexer no código |
| D10 | **Perguntar ≠ escalar** | O formulário vai para todos; **o critério entra na hora de montar a escala**, não na hora de perguntar | Perguntar não custa nada e não deixa ninguém de fora do convite. Quem não vai ser escalado agora (Matheus Ventura 🎓, Sebastião 👔, os 🧪 em formação) aparece na tela de gestão **marcado**, não ausente |
| D11 | **Prazo é social, não técnico** | O texto anuncia **quarta, 09/09**. O formulário **continua aceitando** resposta depois | Vai ter gente respondendo atrasado — é fato conhecido. Fechar o formulário no prazo puniria justamente quem você mais quer alcançar. Quem fecha é o gestor, quando quiser |

---

## 5. Modelo de privacidade

Esta é uma decisão de convivência antes de ser técnica, então fica em seção própria.

| Quem | Vê o quê |
|---|---|
| **Músico** | Apenas a **própria** resposta, apenas no dispositivo em que respondeu |
| **Gestor** (Davi, André) | Tudo |
| **Qualquer outra pessoa** | Nada |

**Depois que o gestor encerra as respostas de um evento**, o formulário fecha para todos os músicos — nem a própria resposta continua acessível. A leitura passa a ser exclusiva dos gestores.

### O buraco que a D1 abre — e como ele fecha

A decisão do link público tem uma consequência que precisa ser dita: **o nome não é senha.** Se qualquer pessoa pudesse clicar em "Elias" e ver o que ele respondeu, a disponibilidade de todo mundo estaria exposta — exatamente o que a D7 proíbe.

**Solução:** o app grava uma chave de edição no navegador de quem respondeu.

- Você seleciona seu nome **no seu celular**, onde já respondeu → suas respostas aparecem para editar
- Alguém seleciona seu nome **em outro aparelho** → formulário **em branco**. Nada é revelado
- Se essa pessoa mesmo assim preencher e enviar, o gestor recebe um ⚠️ *"resposta alterada de outro dispositivo"* e **as duas versões ficam guardadas** no log

Isso preserva o atrito zero e fecha o vazamento. Se algum dia virar problema de verdade, o plano de saída é o link único por músico (`/d/ab12cd`) — mesmo produto, só muda a forma de entrar.

---

## 6. Escopo funcional

### 6.1 Formulário do músico (público, sem login)

**URL:** `music-rgnr.vercel.app/setembro`

#### Fluxo

**Passo 1 — Quem é você?**
Lista dos músicos com busca. Nomes vêm do `elenco.md`. Ao selecionar, o app grava a chave de edição no navegador (§5).

**Quem aparece na lista:** os 36. Entram inclusive **Sebastião** (👔, maestro do Classic), **Matheus Ventura** (🎓, sem audição fechada) e todo mundo que serve em duas frentes — Raquel Malta, Nayanne, Arely, Diego, Gustavo.

*Fora da lista:* apenas **Pr. Anderson** (⛔ restrição vigente).

> **Por que perguntar até para quem não vai ser escalado (D10):** o custo de perguntar é zero e o de não perguntar é alguém se sentir fora do grupo. O filtro acontece na §6.2, não aqui.

**Passo 2 — Seus dados** *(pré-preenchidos, ele só confirma)*
- **WhatsApp** — para o gestor acionar plano B direto da tela
- **Instrumento principal** — o que ele toca de verdade
- **Também cubro** — múltipla escolha (resolve André Lima violão/baixo, Israel coringa, Lucas de Jesus guitarra/baixo)

> Efeito colateral valioso: isso **valida o elenco**. Se alguém marcar diferente do que está no `elenco.md`, é informação nova para a liderança.

**Passo 3 — As datas**
Um cartão por data, na vertical. O cartão muda de cara conforme o tipo do evento:

```
┌────────────────────────────────────────────┐
│ 🔥 Sexta, 11 de setembro                   │
│ Fire · 20h · passagem de som 18h           │
│                                            │
│  [ ✅ Sim ] [ 🤝 Se precisar ] [ ❌ Não ]   │
│                                            │
│  ☐ Consigo chegar na passagem de som (18h) │
│  + adicionar observação                    │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ ⛪ Sábado, 12 de setembro                   │
│ Culto de Santa Ceia · 19h · passagem 15h   │
│                                            │
│  [ ✅ Sim ] [ 🤝 Se precisar ] [ ❌ Não ]   │
│                                            │
│  ☐ Consigo chegar na passagem de som (15h) │
│  + adicionar observação                    │
└────────────────────────────────────────────┘
```

- Os 3 botões são grandes e coloridos (verde / amarelo / cinza). Um toque.
- O checkbox de passagem de som e a observação **só aparecem** se marcou Sim ou Se precisar.
- Observação é opcional e curta: *"só chego 20h30"*, *"tenho viagem, confirmo quinta"*.

**Passo 4 — Enviar**
Resumo do que respondeu + confirmação visual. Mensagem: *"Pode voltar neste link e mudar sua resposta a qualquer momento."*

#### O prazo (D11)

O formulário anuncia **"responda até quarta, 09/09"** — no topo e na confirmação. Mas **não fecha na quarta.**

O prazo existe para criar urgência, não para punir. Quem chegar depois responde normalmente; quem já respondeu pode mudar. **Quem fecha o formulário é o gestor**, no botão, quando a escala estiver montada.

Tecnicamente são duas coisas separadas: `prazo_resposta` (texto exibido) e `aberto_para_resposta` (o que de fato controla). Nunca amarrar uma na outra.

#### Regras do formulário

- **Editável** enquanto o evento estiver aberto para resposta
- **Encerrado:** tela de "respostas encerradas", sem exibir dado nenhum (§5)
- **Salvamento parcial:** cada data é salva ao ser tocada. Ninguém perde 6 respostas porque a internet caiu no final

---

### 6.2 Tela de gestão (login obrigatório)

Quatro visões. A ordem abaixo é a ordem de uso real.

#### A. Painel do mês — `/admin`

As 6 datas em cartões, com semáforo por data:

| Sinal | Significado |
|---|---|
| 🟢 | Escala completa, sem alerta de regra, planos B nomeados |
| 🟡 | Montada, mas com alerta (falta plano B, sem âncora, iniciante sem cobertura) |
| 🔴 | Função obrigatória vazia |
| ⚪ | Ainda não começou |

Cada cartão mostra: quantos responderam / total, funções preenchidas, e o alerta mais grave.

#### B. Status de respostas — `/admin/respostas`

Com 36 pessoas, **cobrar é metade do trabalho**. Esta tela existe para isso:

- Lista de quem respondeu e quem falta, ordenada por status (✅ ativo primeiro — são os que importam)
- Botão **"copiar cobrança"** que gera a mensagem pronta com o link, para colar no WhatsApp
- Link direto `wa.me/` por pessoa
- Destaque para quem é 🕐 presença baixa ou "só na escala" — a regra da casa manda **confirmação dupla** para esses
- ⚠️ Marca em quem respondeu de outro dispositivo (§5)
- 🆕 **Marca em quem respondeu depois da escala já estar montada.** Consequência direta da D11: se o Léo responde na quinta e você fechou a escala na quarta, o app te avisa — pode ser que valha reabrir a decisão

#### C. Montar a escala — `/admin/evento/[data]` ← **a tela principal**

##### Duas formações, conforme o tipo do evento

Isto vem direto do `regras-de-escala.md` §1 e é a mudança mais importante desta versão do PRD: **sexta e sábado não são a mesma coisa.**

**⛪ Culto (sábados) — 9 funções**

| Função | Obrigatória | Plano B obrigatório |
|---|---|---|
| 🎹 Teclado base | Sim | |
| 🎹 Teclado auxiliar | Desejável | |
| 🎸 Guitarra 1 | Sim | |
| 🎸 Guitarra 2 | Não | |
| 🎸 Violão | Sim | |
| 🎸 **Baixo** | Sim | **Sim — sempre** |
| 🥁 Bateria | Sim | |
| 🔈 Click e VS | Sim | *(sai junto com a bateria por padrão)* |
| 🎤 Comunicação | Sim | |

**🔥 Fire (sextas) — 4 funções, formação enxuta**

| Função | Obrigatória |
|---|---|
| 🎹 Teclado | Sim |
| 🎸 Violão **ou** Guitarra | Sim (uma das duas) |
| 🎸 Baixo | Sim |
| 🥁 Bateria **ou** Cajon | Sim |

##### O Fire inverte a regra do "em formação"

No **Culto**, escalar alguém 🧪 em formação é um alerta. No **Fire**, é o objetivo — o `frentes.md` diz literalmente que o Fire é o **laboratório**, "o melhor lugar para testar gente nova sem risco".

Então, num evento tipo Fire, o app faz o contrário: destaca os candidatos a estreia em vez de avisar contra eles.

> 💡 **Três Fires em setembro é uma oportunidade rara.** As decisões que estão paradas na liderança — estrear o **João S** (bateria), subir a **Talita** do Kids, e usar o **Josiel** (que tem disponibilidade para Fire, não para culto) — cabem todas neste mês. O app vai sugerir isso na tela.

##### O seletor de cada função

Ao abrir, mostra **só quem toca aquele instrumento**, agrupado assim:

```
✅ DISPONÍVEL
   Elias              Top · Alta · 1ª linha
   Ruan Souza         Bom · Alta · 2ª linha
🤝 SE PRECISAR
   André Lima         Bom · Alta · ⚠️ está no violão nesta escala
❌ NÃO PODE            (recolhido)
⋯  SEM RESPOSTA        (recolhido, em cinza)
   Raphael Francisco  Intermediário · Média
```

Comportamentos que fazem esta tela valer a pena:

1. **Ordem de escala embutida.** A ordem vem do `por-instrumento.md` (1ª linha → 2ª linha → carta na manga → reserva). Você não precisa lembrar.
2. **Nível e presença sempre à vista.** Nunca escalar às cegas.
3. **Trava do André Lima.** Escalado no violão, ele aparece marcado no baixo com aviso — a regra "não dá para contar com ele nas duas funções no mesmo culto" vira interface, não memória.
4. **Alguém escalado em duas funções** dispara aviso (exceto bateria + click/VS, que é o padrão da casa).
5. **Campo de plano B** por função, priorizando quem marcou 🤝 "Se precisar".
6. **Observações do músico** aparecem inline ("só chego 20h30").
7. **Quem não vai passar som** aparece com ⚠️ — a regra é "quem não passa som não toca".
8. **Status sempre visível** (🎓 👔 🧪 💤 🕐). É o que faz a D10 funcionar: o Matheus Ventura e o Sebastião respondem o formulário como todo mundo, mas aparecem aqui marcados — você vê na hora que não é pra escalar, sem precisar lembrar por quê.

##### Painel de checagem (lateral, ao vivo)

Os 8 itens do `_modelo-escala.md`, verificados automaticamente enquanto você monta:

- ☐ Âncora (Top/Avançado) na base rítmica — bateria + baixo
- ☐ Âncora nas harmonias — teclado + guitarra/violão
- ☐ Nenhum iniciante sem cobertura de nível superior
- ☐ Plano B de baixo nomeado
- ☐ Baixo é **Bom ou acima** *(só em evento marcado como exigência alta)*
- ☐ Ninguém no 4º culto seguido na mesma função *(depende do histórico — ver §12)*
- ☐ Pelo menos um dos dois líderes fora do palco
- ☐ Ninguém com status ⛔ na lista

Vermelho não bloqueia — **avisa**. A liderança pode fechar contra a regra conscientemente; nesse caso o app pede uma justificativa curta, que fica registrada. (O documento já prevê isso: *"escalar baixo abaixo de Bom é risco consciente"*.)

Cada evento tem um marcador de **exigência alta**, ligado pelo gestor. Ele é quem ativa as checagens mais duras. Candidatos naturais: Santa Ceia, conferências, culto com repertório novo.

##### Estados da escala

`rascunho` → `publicada` → `fechada`

- **Rascunho:** só os gestores veem
- **Publicada:** gera um link somente-leitura da **escala** (não da disponibilidade) para mandar no grupo
- **Fechada:** pós-evento, entra no histórico

#### D. Plano B ao vivo — `/admin/evento/[data]/cobertura`

A tela de quando alguém cai. Para uma data já montada:

- Lista por função de **quem está disponível e não foi escalado**, ordenada por ✅ Sim antes de 🤝 Se precisar, e dentro disso pela ordem de escala
- Botão **"chamar no WhatsApp"** com mensagem pronta: *"Fulano, o Elias não vai poder no dia 12. Você consegue cobrir o baixo?"*
- Botão **"substituir"** que troca o titular, registra o motivo e devolve o substituído para a lista de disponíveis

> Esta é a tela que resolve a dor descrita literalmente no pedido: *"onde eu também possa ver depois quem teria disponibilidade caso o escalado cancelar"*.

---

## 7. Regras de negócio herdadas

O app **não inventa regra**. Ele executa o que já está em `regras-de-escala.md`, `criterios-de-nivel.md` e `frentes.md`:

| Regra | Como aparece no produto |
|---|---|
| Nível é **por instrumento**, não por pessoa | Modelo de dados: nível vive na relação músico × instrumento |
| ⛔ Restrição vigente não é escalado | Some do formulário e do seletor de escala |
| 💤 Destreinado não volta direto para culto | Aviso ao ser escalado em Culto; liberado em Fire |
| 🧪 Em formação só vai para Fire/Kids | Aviso em Culto · **destaque positivo em Fire** |
| Iniciante só com cobertura | Alerta no painel de checagem |
| Baixo é a função de maior cuidado | Ordem de preenchimento sugerida: **baixo → bateria → teclado → harmonias**; plano B obrigatório |
| Confirmação em 48h | Tela de respostas marca quem falta confirmar |
| "Só na escala" e 🕐 pedem confirmação dupla | Selo na tela de respostas |
| Click e VS sai com a bateria | Preenchido automaticamente ao escalar o baterista, editável |
| Pelo menos um líder fora do palco | Item do painel de checagem |
| Fire é o laboratório de estreia | Formação enxuta + destaque para 🧪 |

---

## 8. Modelo de dados

```
musicos                        instrumentos
├ id                           ├ id
├ nome                         ├ nome  (baixo, bateria, cajon, teclado, guitarra, violão…)
├ slug                         └ ordem_criticidade  (baixo=1 … violão=5)
├ whatsapp
├ status        ✅🕐💤🎓🧪⛔📤   musico_instrumento
├ presenca      alta/média/…    ├ musico_id
├ frentes[]     culto/fire/…    ├ instrumento_id
├ eh_lider      bool            ├ nivel        top/avançado/bom/intermediário/iniciante
└ ativo         bool            ├ principal    bool
                                └ ordem_escala 1ª linha / 2ª / carta na manga / reserva / formação

eventos                        disponibilidades
├ id                           ├ id
├ data                         ├ musico_id ──┐
├ tipo    culto | fire          ├ evento_id ──┤ único
├ titulo  "Culto de Santa Ceia" ├ status   sim | se_precisar | nao
├ hora_evento                   ├ passagem_som  bool
├ hora_passagem                 ├ observacao    text
├ exigencia_alta      bool      ├ chave_edicao  hash  ← §5
├ aberto_para_resposta bool     ├ conflito_dispositivo bool
└ status  rascunho/publicada/fechada  └ criado_em / atualizado_em

escalacoes                     admins
├ id                           ├ email  (allowlist: 2)
├ evento_id                    └ nome
├ funcao   teclado_base | baixo | …
├ musico_id
├ tipo     titular | plano_b
├ confirmado     bool
├ justificativa  text   ← quando fecha contra uma regra
├ substituiu_id  fk     ← histórico de troca
└ criado_por / criado_em
```

**Seed inicial:** os 37 músicos, instrumentos, níveis e ordem de escala saem direto do `elenco.md` e do `por-instrumento.md`. Trabalho de importação feito uma vez.

---

## 9. Stack e arquitetura

### Recomendação: **Next.js na Vercel + Supabase** — sua intuição está certa

| Camada | Escolha | Por quê |
|---|---|---|
| **Front + back** | Next.js (App Router) + TypeScript | Um projeto só. Server Actions resolvem a escrita sem construir API separada |
| **Estilo** | Tailwind + shadcn/ui | Componentes prontos e acessíveis; mobile-first sem esforço |
| **Hospedagem** | **Vercel** — `music-rgnr.vercel.app` | Deploy no push, HTTPS, preview por branch, domínio próprio depois. R$ 0 |
| **Banco** | **Supabase (Postgres)** | Postgres de verdade — a relação músico × instrumento × nível pede relacional |
| **Auth** | Supabase Auth (magic link) | Login por e-mail pronto. Allowlist de 2 e-mails |
| **Tipos** | `supabase gen types typescript` | Schema tipado de ponta a ponta |

**Custo mensal: R$ 0.** 37 pessoas × 6 datas ≈ 220 linhas/mês. Não chega perto de nenhum limite de free tier.

### Por que Supabase e não outra coisa

- O painel de tabelas deixa **você mesmo corrigir dados** sem depender de código — importa muito num projeto tocado por duas pessoas ocupadas
- Auth com magic link pronta economiza um dia de trabalho
- É Postgres puro: se um dia sair do Supabase, o banco vai junto

### Decisões de arquitetura

1. **Toda escrita passa pelo servidor** (Server Actions com service role). O navegador do músico **nunca** fala direto com o banco. Com a D7 (privacidade) sendo requisito, não quero depender de acertar as políticas de acesso de primeira.
2. **RLS ligado e restritivo** como segunda camada.
3. **Disponibilidades são privadas** por construção. A tabela inteira é inacessível sem sessão de gestor.

### Riscos técnicos conhecidos

| Risco | Mitigação |
|---|---|
| Free tier do Supabase pausa projetos inativos (confirmar termos atuais antes de subir) | Cron semanal na Vercel dando um ping. 5 linhas de código |
| **D8 tirou o backup natural:** a escala não existe mais em Markdown | Export mensal automático em `.md` no formato do `_modelo-escala.md`, para guardar no Obsidian. **Deixa de ser opcional** |
| Link público = alguém responder pelo outro | Chave de edição (§5) + log das duas versões + gestor edita tudo |

---

## 10. As 6 datas de setembro/2026

| # | Data | Dia | Tipo | Passagem | Começa | Formação |
|---|---|---|---|---|---|---|
| 1 | 11/09 | Sexta | 🔥 **Fire** | 18h | 20h | Enxuta (4) |
| 2 | 12/09 | Sábado | ⛪ **Culto de Santa Ceia** | 15h | 19h | Completa (9) |
| 3 | 18/09 | Sexta | 🔥 **Fire** | 18h | 20h | Enxuta (4) |
| 4 | 19/09 | Sábado | ⛪ **Culto** | 15h | 19h | Completa (9) |
| 5 | 25/09 | Sexta | 🔥 **Fire** | 18h | 20h | Enxuta (4) |
| 6 | 26/09 | Sábado | ⛪ **Culto** | 15h | 19h | Completa (9) |

**Padrão da casa:** sexta é Fire, sábado é culto. O app já cadastra assim por padrão — cadastro de data a data, mas com o tipo pré-selecionado pelo dia da semana.

> ⚠️ **Divergência a confirmar:** o `checklist-culto.md` registra a passagem de som da **Banda às 14h30** (e o Vocal às 15h). Aqui ficou 15h. Se 14h30 for o horário real da banda, é um campo para ajustar — só muda o texto exibido.

---

## 11. Métricas de sucesso

O MVP deu certo se, no fim de setembro:

| Métrica | Meta |
|---|---|
| Músicos ✅ ativos que responderam | ≥ 80% em até 72h do envio do link |
| Datas com escala fechada pelo app | 6 de 6 |
| Escalas de culto com plano B de baixo nomeado | 100% |
| Tempo para montar uma escala | < 10 minutos |
| Trocas de última hora resolvidas pela tela de cobertura | ≥ 1 (é o teste real da funcionalidade) |
| Escalas fechadas violando regra sem justificativa | 0 |
| Estreias em Fire viabilizadas no mês | ≥ 1 (João S, Talita ou Josiel) |

**Métrica qualitativa:** o André Santos consegue montar uma escala sozinho, sem precisar te perguntar nada.

---

## 12. Fora do MVP — o roadmap que este desenho já prepara

Em ordem de valor:

1. **Histórico de participação automático.** Depois do evento, o app já sabe quem tocou. Habilita a regra "ninguém 4 cultos seguidos" e o rodízio justo. **Subiu de prioridade por causa da D8** — com o Obsidian fora, o `historico-participacao.md` fica órfão
2. **Confirmação do escalado** pelo próprio link ("confirmo que vou")
3. **Recorrência de eventos** — gerar o mês inteiro de uma vez (sexta=Fire, sábado=culto já é regra conhecida)
4. **Lembretes automáticos** (48h antes, cobrança de quem não respondeu)
5. **Integração com setlist e repertório** — a ponte com o Obsidian
6. **Vocal e Classic** na mesma ferramenta
7. **Painel de saúde do elenco** — quem está há 2 meses sem escalar, alertas de presença
8. **Trilha de formação** — acompanhar Kids → Fire → Culto de cada músico

> O modelo de dados da §8 comporta 1, 2, 3 e 4 sem refatoração.

---

## 13. Pendências

| # | Pendência | Impacto | Proposta |
|---|---|---|---|
| P1 | **E-mail do André Santos** | Allowlist de login | — |
| P2 | Passagem de som do culto: 15h ou 14h30? | Texto do formulário | Ver §10 |

*Resolvido na v0.3:* lista de nomes fechada em 36 (D6/D10) — Sebastião e Matheus Ventura entram.
*Resolvido na v0.4:* prazo de resposta = quarta 09/09, sem fechar o formulário (D11).

---

## 14. O elefante na sala: o Fire de 11/09

O primeiro evento é **daqui a 3 dias** e o sistema não existe ainda.

Leitura honesta: **o Fire de 11/09 provavelmente sai no braço.** Mesmo que o formulário suba amanhã, o pessoal precisa de tempo para responder, e a regra da casa é escala fechada com 7 dias de antecedência.

**Proposta:**

- O formulário cobre **as 6 datas** — nada se perde
- Prazo anunciado: **quarta, 09/09** — mas sem fechar (D11)
- A escala do **11/09** você e o André fecham como sempre fizeram, usando o que chegar de resposta até lá
- O sistema é validado de verdade a partir do **12/09** (Santa Ceia), com prazo folgado

> ⚠️ **O prazo de quarta só existe se o formulário estiver no ar hoje ou amanhã cedo.** É o que define o ritmo das fases 0 e 1 do plano técnico.

---

## 15. Próximos passos

1. André revisa este PRD
2. Resolver as pendências da §13
3. Escrevo o plano técnico (schema, telas, ordem de implementação)
4. Seed do banco a partir do `elenco.md` e `por-instrumento.md`
5. **Formulário no ar primeiro** — é o que trava tudo, o link precisa ir para o grupo o quanto antes
6. Tela de gestão em seguida, enquanto as respostas chegam
