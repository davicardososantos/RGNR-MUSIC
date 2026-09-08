-- ============================================================
-- Escala MUSIC — seed do elenco
-- Fonte: Documents/RGNR/MUSIC/lideranca/equipe/elenco.md
--        Documents/RGNR/MUSIC/lideranca/equipe/por-instrumento.md
-- Snapshot de 30/08/2026 · transcrito em 08/09/2026
--
-- ⚠️ CONFERIR ANTES DE SUBIR. Escala montada sobre nível errado
-- é pior que escala montada na mão.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Os 37 do elenco
--    no_formulario = false apenas no Pr. Anderson (⛔) → 36 recebem o link
-- ------------------------------------------------------------

insert into musicos (nome, slug, status, presenca, frentes, eh_lider, nota) values
  ('Alef',              'alef',              'ativo',          'alta',         '{culto}',         false, 'Sempre com a gente. Esposo da Edvania (liderança do Vocal)'),
  ('André Lima',        'andre-lima',        'ativo',          'alta',         '{culto}',         false, 'O músico mais presente da banda. Também segura o baixo'),
  ('André Santos',      'andre-santos',      'ativo',          'alta',         '{culto}',         true,  'Líder da Banda (com o Davi)'),
  ('Arely',             'arely',             'destreinado',    'media',        '{kids,classic}',  false, 'Faz tempo que não toca. Cello no Classic'),
  ('Arthur',            'arthur',            'presenca_baixa', 'baixa',        '{culto}',         false, 'Enrolado com o serviço, quase não vem aos cultos'),
  ('Calebe',            'calebe',            'presenca_baixa', 'baixa',        '{culto}',         false, 'Toca bem, mas quase não aparece'),
  ('Caliel',            'caliel',            'ativo',          'alta',         '{culto}',         false, 'Um dos mais antigos. Trabalha no audiovisual da sede'),
  ('Cláudio',           'claudio',           'presenca_baixa', 'ausente',      '{culto}',         false, 'Toca bem, às vezes escorrega. Bem sumido'),
  ('Daniel',            'daniel',            'ativo',          'media',        '{culto}',         false, 'Nível médio pra bom. Também faz comunicação'),
  ('Davi',              'davi',              'ativo',          'alta',         '{culto}',         true,  'Líder da Banda (com o André Santos)'),
  ('Diego',             'diego',             'ativo',          'media',        '{kids,classic}',  false, 'Violão no Kids, cello no Classic'),
  ('Elias',             'elias',             'ativo',          'alta',         '{culto}',         false, 'Melhor baixo da casa. Não confundir com o Elias do ADM/Expansão'),
  ('Gabriel',           'gabriel',           'ativo',          'media',        '{culto}',         false, 'Novo, mas já toca bem'),
  ('Gustavo',           'gustavo',           'em_formacao',    'media',        '{kids,classic}',  false, 'Teclado no Kids, flauta no Classic'),
  ('Israel',            'israel',            'ativo',          'media',        '{culto}',         false, 'Coringa: quebra galho em quase tudo'),
  ('João S',            'joao-s',            'em_formacao',    null,           '{fire}',          false, 'Novo. Vamos começar a escalar nos Fire'),
  ('João Ygor',         'joao-ygor',         'em_formacao',    'media',        '{kids}',          false, 'Hoje só cajon no Kids'),
  ('Josiel',            'josiel',            'em_formacao',    null,           '{fire}',          false, 'Toca nos Fire. Sem disponibilidade para cultos'),
  ('Léo',               'leo',               'ativo',          'media',        '{culto}',         false, 'Nível top'),
  ('Lucas de Jesus',    'lucas-de-jesus',    'ativo',          'media',        '{culto}',         false, 'Ex-líder da banda. Principal é a guitarra'),
  ('Luiz',              'luiz',              'presenca_baixa', 'ausente',      '{culto}',         false, 'Parado por demandas do ADM. Trabalha na sede'),
  ('Mateus',            'mateus',            'ativo',          'so_na_escala', '{culto}',         false, 'Vem mais no dia em que está escalado. Cobre guitarra e violão'),
  ('Matheus',           'matheus',           'ativo',          'media',        '{culto}',         false, 'Baterista avançado, um dos pilares'),
  ('Matheus Ventura',   'matheus-ventura',   'em_avaliacao',   null,           '{}',              false, 'Audição pendente'),
  ('Maynara',           'maynara',           'em_formacao',    'media',        '{kids}',          false, 'Violão no Kids'),
  ('Nayanne',           'nayanne',           'destreinado',    'alta',         '{vocal,culto}',   false, 'Faz parte do Vocal; em alguns cultos lidera a adoração'),
  ('Pr. Anderson',      'pr-anderson',       'restricao',      null,           '{}',              false, 'Restrição vigente para escala — orientação do Figueira'),
  ('Raphael',           'raphael',           'ativo',          'media',        '{culto}',         false, 'Quase no nível do Caliel e do Matheus. Também opera click e VS'),
  ('Raphael Francisco', 'raphael-francisco', 'ativo',          'media',        '{culto}',         false, 'Novo na banda'),
  ('Raquel Malta',      'raquel-malta',      'ativo',          'sob_demanda',  '{vocal,culto}',   false, 'Líder do Vocal. Chamamos quando precisa'),
  ('Ruan Pablo',        'ruan-pablo',        'presenca_baixa', 'baixa',        '{culto}',         false, 'Tecladista top, mas sumido'),
  ('Ruan Souza',        'ruan-souza',        'ativo',          'alta',         '{culto}',         false, 'Sempre presente nos cultos'),
  ('Samuel',            'samuel',            'ativo',          'so_na_escala', '{culto}',         false, 'Novinho. Manda bem no teclado auxiliar'),
  ('Samuel Firmino',    'samuel-firmino',    'ativo',          'sob_demanda',  '{culto,vocal}',   false, 'Quebra-galho geral. ⚠️ Instrumento a definir pelo formulário'),
  ('Sebastião',         'sebastiao',         'lideranca',      'baixa',        '{classic}',       false, 'Maestro da orquestra e líder do Classic. Agenda cheia'),
  ('Talita',            'talita',            'em_formacao',    'media',        '{kids}',          false, 'Nova. Candidata a estrear nos Fire em breve'),
  ('Vinícius',          'vinicius',          'presenca_baixa', 'so_na_escala', '{culto}',         false, 'Quase top, faltam alguns detalhes. Presença bem baixa');

-- ⛔ Único fora do formulário
update musicos set no_formulario = false where slug = 'pr-anderson';

-- ------------------------------------------------------------
-- 2. Nível e ordem de escala, POR INSTRUMENTO
--    nivel null = "—" ou "A avaliar" no elenco
-- ------------------------------------------------------------

insert into musico_instrumento (musico_id, instrumento_id, nivel, principal, ordem)
select m.id, v.instrumento, v.nivel::nivel_tecnico, v.principal, v.ordem::ordem_escala
from (values
  -- 🎸 BAIXO — posição de maior cuidado
  ('elias',             'baixo',    'top',           true,  'primeira_linha'),
  ('andre-lima',        'baixo',    'bom',           false, 'segunda_linha'),
  ('ruan-souza',        'baixo',    'bom',           true,  'segunda_linha'),
  ('raphael-francisco', 'baixo',    'intermediario', true,  'terceira_linha'),
  ('lucas-de-jesus',    'baixo',    'avancado',      false, 'carta_na_manga'),
  ('josiel',            'baixo',    'intermediario', true,  'formacao'),
  ('arely',             'baixo',    'iniciante',     false, 'formacao'),
  ('israel',            'baixo',    'iniciante',     false, 'reserva'),

  -- 🎹 TECLADO
  ('andre-santos',      'teclado',  'top',           true,  'primeira_linha'),
  ('davi',              'teclado',  'avancado',      true,  'primeira_linha'),
  ('ruan-pablo',        'teclado',  'top',           true,  'segunda_linha'),
  ('vinicius',          'teclado',  'avancado',      true,  'segunda_linha'),
  ('raquel-malta',      'teclado',  'avancado',      true,  'segunda_linha'),
  ('samuel',            'teclado',  'bom',           true,  'segunda_linha'),
  ('calebe',            'teclado',  'bom',           true,  'segunda_linha'),
  ('israel',            'teclado',  'intermediario', true,  'segunda_linha'),
  ('nayanne',           'teclado',  'intermediario', true,  'reserva'),
  ('gustavo',           'teclado',  'iniciante',     true,  'formacao'),
  ('sebastiao',         'teclado',  null,            true,  'indisponivel'),
  ('pr-anderson',       'teclado',  null,            true,  'indisponivel'),

  -- 🥁 BATERIA — posição forte
  ('caliel',            'bateria',  'top',           true,  'primeira_linha'),
  ('matheus',           'bateria',  'top',           true,  'primeira_linha'),
  ('raphael',           'bateria',  'avancado',      true,  'segunda_linha'),
  ('gabriel',           'bateria',  'bom',           true,  'segunda_linha'),
  ('joao-s',            'bateria',  'intermediario', true,  'formacao'),
  ('joao-ygor',         'bateria',  'iniciante',     false, 'formacao'),
  ('arely',             'bateria',  'iniciante',     false, 'formacao'),

  -- 🥁 CAJON
  ('joao-ygor',         'cajon',    'iniciante',     true,  'formacao'),
  ('arely',             'cajon',    'iniciante',     true,  'formacao'),

  -- 🎸 GUITARRA — posição forte
  ('alef',              'guitarra', 'top',           true,  'primeira_linha'),
  ('leo',               'guitarra', 'top',           true,  'primeira_linha'),
  ('lucas-de-jesus',    'guitarra', 'top',           true,  'primeira_linha'),
  ('daniel',            'guitarra', 'bom',           true,  'segunda_linha'),
  ('mateus',            'guitarra', 'intermediario', false, 'segunda_linha'),
  ('israel',            'guitarra', 'iniciante',     false, 'reserva'),
  ('matheus-ventura',   'guitarra', null,            true,  'indisponivel'),

  -- 🎸 VIOLÃO — posição resolvida
  ('andre-lima',        'violao',   'top',           true,  'primeira_linha'),
  ('mateus',            'violao',   'bom',           true,  'segunda_linha'),
  ('raquel-malta',      'violao',   'avancado',      false, 'segunda_linha'),
  ('israel',            'violao',   'intermediario', false, 'segunda_linha'),
  ('talita',            'violao',   'intermediario', true,  'formacao'),
  ('claudio',           'violao',   'bom',           true,  'reserva'),
  ('luiz',              'violao',   'intermediario', true,  'reserva'),
  ('maynara',           'violao',   'iniciante',     true,  'formacao'),
  ('diego',             'violao',   'iniciante',     true,  'formacao'),
  ('arthur',            'violao',   'iniciante',     true,  'formacao')
) as v(slug, instrumento, nivel, principal, ordem)
join musicos m on m.slug = v.slug;

-- ------------------------------------------------------------
-- 3. Overrides de ordem por função
--    O Samuel é 2ª linha no teclado BASE, mas 1ª no AUXILIAR
--    ("é onde ele mais rende"). Os líderes é o contrário.
-- ------------------------------------------------------------

insert into musico_funcao_ordem (musico_id, funcao_id, ordem)
select m.id, v.funcao, v.ordem::ordem_escala
from (values
  ('samuel',       'teclado_aux', 'primeira_linha'),
  ('davi',         'teclado_aux', 'segunda_linha'),
  ('andre-santos', 'teclado_aux', 'segunda_linha')
) as v(slug, funcao, ordem)
join musicos m on m.slug = v.slug;

-- ------------------------------------------------------------
-- 4. Os 6 eventos de setembro/2026
--    Sexta = Fire (18h passagem / 20h) · Sábado = Culto (15h / 19h)
--    prazo_resposta é SÓ TEXTO (D11) — quem fecha é aberto_para_resposta
-- ------------------------------------------------------------

insert into eventos (data, tipo, titulo, hora_evento, hora_passagem, exigencia_alta, prazo_resposta, aberto_para_resposta, status) values
  ('2026-09-11', 'fire',  null,                   '20:00', '18:00', false, '2026-09-09', true, 'rascunho'),
  ('2026-09-12', 'culto', 'Culto de Santa Ceia',  '19:00', '15:00', false, '2026-09-09', true, 'rascunho'),
  ('2026-09-18', 'fire',  null,                   '20:00', '18:00', false, '2026-09-09', true, 'rascunho'),
  ('2026-09-19', 'culto', null,                   '19:00', '15:00', false, '2026-09-09', true, 'rascunho'),
  ('2026-09-25', 'fire',  null,                   '20:00', '18:00', false, '2026-09-09', true, 'rascunho'),
  ('2026-09-26', 'culto', null,                   '19:00', '15:00', false, '2026-09-09', true, 'rascunho');

-- ------------------------------------------------------------
-- 5. Gestores (allowlist do /admin)
-- ------------------------------------------------------------

insert into admins (email, nome) values
  ('davicardoso.dc@gmail.com', 'Davi Cardoso');
  -- TODO P1: e-mail do André Santos
  -- insert into admins (email, nome) values ('...', 'André Santos');
