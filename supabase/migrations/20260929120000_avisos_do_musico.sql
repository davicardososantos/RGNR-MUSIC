-- Avisos do músico: o que a pessoa contou por fora do formulário.
--
-- O caso que originou isto: um músico avisa pelo WhatsApp que começa num
-- trabalho novo e não vai conseguir tocar o mês inteiro. Outro está passando
-- por um momento pessoal e não faz sentido ficar cobrando o formulário dele.
-- Até aqui isso só existia na memória de quem recebeu a mensagem.
--
-- O aviso é um recado entre os gestores, não uma resposta do músico: nada
-- aqui grava disponibilidade no lugar dele (PRD §5.1). O painel usa o aviso
-- para três coisas, todas informativas (D12):
--   * na montagem da escala, quem avisou que não pode aparece marcado;
--   * em Respostas, as datas cobertas pelo aviso não contam como "falta";
--   * com "não cobrar", a pessoa sai da lista de cobrança do WhatsApp.
--
-- O texto fica no banco e nunca no código: é assunto pessoal de gente da
-- igreja, e o repositório pode ser lido por outras pessoas no futuro.

create table avisos_musico (
  id                uuid primary key default gen_random_uuid(),
  musico_id         uuid not null references musicos on delete cascade,
  texto             text not null check (char_length(texto) between 3 and 280),
  -- Período em que a pessoa avisou que não pode. Os dois juntos, ou nenhum.
  indisponivel_de   date,
  indisponivel_ate  date,
  nao_cobrar        boolean not null default false,
  criado_por        text not null,
  criado_em         timestamptz not null default now(),
  encerrado_em      timestamptz,
  encerrado_por     text,
  constraint avisos_musico_periodo_completo
    check ((indisponivel_de is null) = (indisponivel_ate is null)),
  constraint avisos_musico_periodo_em_ordem
    check (indisponivel_de is null or indisponivel_de <= indisponivel_ate)
);

create index avisos_musico_abertos_idx on avisos_musico (musico_id)
  where encerrado_em is null;

-- Mesmo padrão do resto do schema: RLS ligado e nenhuma policy. Só a
-- service role, no servidor, lê e escreve.
alter table avisos_musico enable row level security;

comment on table avisos_musico is
  'Recado dos gestores sobre um músico (indisponibilidade combinada por fora, não cobrar o formulário). Não substitui a resposta do músico.';
comment on column avisos_musico.nao_cobrar is
  'true = não aparece na lista de cobrança; o contato é direto, pelos gestores.';
comment on column avisos_musico.encerrado_em is
  'Nulo = aviso aberto. Aviso com período vence sozinho depois de indisponivel_ate.';
