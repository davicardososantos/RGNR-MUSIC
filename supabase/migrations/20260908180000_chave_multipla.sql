-- Um navegador pode responder por mais de um músico.
--
-- O caso real: o Davi ou o André abrem o formulário no próprio celular e
-- preenchem junto com alguém que não tem o link à mão. Com token_hash
-- único, a segunda pessoa sobrescreveria a chave da primeira, e o dono
-- do celular perderia acesso à própria resposta.
--
-- Passa a ser único o PAR (token, músico): um token do navegador pode
-- guardar vários músicos, e cada músico continua tendo uma chave por
-- dispositivo.

alter table chaves_edicao drop constraint chaves_edicao_token_hash_key;

alter table chaves_edicao
  add constraint chaves_edicao_token_musico_unico unique (token_hash, musico_id);

create index if not exists chaves_edicao_token_idx on chaves_edicao (token_hash);
