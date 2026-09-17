-- Quem muda de ideia pelo WhatsApp.
--
-- O caso é rotineiro: o músico marca "sim" no formulário e dias depois manda
-- mensagem avisando que não vai mais dar. Até aqui, a única saída era pedir
-- para ele voltar no link, e enquanto isso a escala era montada em cima de
-- uma resposta que todo mundo já sabia que estava velha.
--
-- Agora o gestor corrige direto no painel. A regra é que a correção nunca
-- se disfarça de resposta do músico: quem alterou e por quê ficam gravados
-- e aparecem na tela, porque a resposta do músico continua sendo a fonte
-- de verdade (PRD §5.1) e o ajuste é um recado sobre ela.

alter table disponibilidades
  add column ajustado_por  text,
  add column motivo_ajuste text,
  add column ajustado_em   timestamptz;

comment on column disponibilidades.ajustado_por is
  'E-mail do gestor que alterou esta resposta pelo painel. Nulo = veio do próprio músico.';

comment on column disponibilidades.motivo_ajuste is
  'Por que a resposta foi alterada por fora do formulário. Ex.: "avisou no WhatsApp que viaja".';

-- O log já guardava toda resposta gravada. Ganha as mesmas duas colunas para
-- que o histórico do músico distinga "ele respondeu" de "alteramos por ele".
alter table disponibilidade_log
  add column ajustado_por text,
  add column motivo       text;

comment on column disponibilidade_log.ajustado_por is
  'E-mail do gestor, quando a linha veio de um ajuste do painel em vez do formulário.';
