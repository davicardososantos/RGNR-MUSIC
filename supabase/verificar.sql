-- Rodar no SQL Editor DEPOIS da migration e do seed.
-- Confere se tudo entrou e se o RLS está ligado em todas as tabelas.

-- ============================================================
-- 1. Contagens — todo "resultado" tem que bater com "esperado"
-- ============================================================

select 'músicos no elenco'      as item, count(*)::text as resultado, '37' as esperado from musicos
union all
select 'recebem o formulário',   count(*)::text, '36' from musicos where no_formulario
union all
select 'músico × instrumento',   count(*)::text, '46' from musico_instrumento
union all
select 'overrides por função',   count(*)::text, '3'  from musico_funcao_ordem
union all
select 'instrumentos',           count(*)::text, '6'  from instrumentos
union all
select 'funções',                count(*)::text, '12' from funcoes
union all
select 'formação do culto',      count(*)::text, '9'  from formacao where tipo = 'culto'
union all
select 'formação do fire',       count(*)::text, '4'  from formacao where tipo = 'fire'
union all
select 'eventos de setembro',    count(*)::text, '6'  from eventos
union all
select 'gestores',               count(*)::text, '1'  from admins
union all
select 'tabelas COM rls',        count(*)::text, '13'
  from pg_tables where schemaname = 'public' and rowsecurity
union all
select '⚠️ tabelas SEM rls',      count(*)::text, '0'
  from pg_tables where schemaname = 'public' and not rowsecurity
union all
select '⚠️ policies (deve ser 0)', count(*)::text, '0'
  from pg_policies where schemaname = 'public';


-- ============================================================
-- 2. O olho humano: isto tem que reproduzir a tabela do baixo
--    em lideranca/equipe/por-instrumento.md
--    Esperado: Elias (top) → André Lima / Ruan Souza (bom) →
--    Raphael Francisco → Lucas de Jesus → Josiel/Arely → Israel
-- ============================================================

select
  m.nome,
  mi.nivel,
  mi.ordem,
  m.presenca,
  m.status
from musico_instrumento mi
join musicos m on m.id = mi.musico_id
where mi.instrumento_id = 'baixo'
order by
  case mi.ordem
    when 'primeira_linha' then 1
    when 'segunda_linha'  then 2
    when 'terceira_linha' then 3
    when 'carta_na_manga' then 4
    when 'reserva'        then 5
    when 'formacao'       then 6
    else 7
  end,
  case mi.nivel
    when 'top'           then 1
    when 'avancado'      then 2
    when 'bom'           then 3
    when 'intermediario' then 4
    when 'iniciante'     then 5
  end;


-- ============================================================
-- 3. Os 6 eventos, do jeito que vão aparecer no formulário
-- ============================================================

select
  to_char(data, 'DD/MM') as dia,
  case extract(dow from data) when 5 then 'sexta' when 6 then 'sábado' end as semana,
  tipo,
  coalesce(titulo, '—') as titulo,
  to_char(hora_passagem, 'HH24hMI') as passagem,
  to_char(hora_evento, 'HH24hMI')   as comeca,
  exigencia_alta,
  aberto_para_resposta
from eventos
order by data;
