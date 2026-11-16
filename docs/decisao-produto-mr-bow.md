# Decisão de produto — aplicação Mr. Bow

**Objectivo actual:** criar uma única aplicação Android/iOS de marca **Mr. Bow**, com uma única comunidade de fãs e um único artista visível ao utilizador. O nome comercial da aplicação não é "Artist Hub".

## Separação entre produto e tecnologia

- **Produto:** aplicação móvel Mr. Bow. Identidade visual, fotografia, comunidade, conteúdos, agenda, mensagens e, no futuro, serviços VIP apenas de Mr. Bow.
- **Código partilhável:** projecto React Native/Expo, componentes de UI, autenticação, consultas, regras de segurança e módulos de negócio. Podem ser clonados/adaptados para outros artistas, mas NÃO serão expostos na aplicação Mr. Bow.
- **Repositório:** `Dev-Ruco/Artist-Hub` continua a ser o nome técnico do repositório de desenvolvimento.
- **Expo Hosting:** mantém-se `owner = ruco222` e `slug = ruco` por já estarem ligados à pré-visualização existente. São identificadores técnicos e não nomes apresentados aos fãs.

## Isolamento do artista

`src/config/brand.ts` define por omissão `BRAND_ARTIST_SLUG = mr-bow` e `BRAND_ARTIST_NAME = Mr. Bow`.

`ArtistContext`:
- no modo demonstrativo, carrega apenas o registo `mr-bow`;
- no Supabase real, filtra `slug = mr-bow` e `status = active` antes de carregar o perfil;
- não disponibiliza qualquer selector de artistas.

As publicações e eventos são carregados com filtro `artist_id`. O isolamento de dados privados exige também políticas RLS, e não apenas filtros na app.

## Outra aplicação futuramente

Criar uma distribuição independente (nome, identificadores Android e iOS, imagens, cor e `EXPO_PUBLIC_ARTIST_SLUG`/`EXPO_PUBLIC_ARTIST_NAME`) e utilizar as mesmas bases técnicas. O código pode ser extraído para um pacote partilhado quando existir efectivamente outro projecto; não é necessário construir um marketplace.

## Estado actual

A app está em fase de protótipo; os serviços de mensagens privadas, pagamentos, moderação e painel de administração não estão concluídos. As operações Supabase só funcionam depois de configurar uma base de testes e aplicar a migração. Os IDs `mz.mrbow.app` são propostos para a futura publicação e necessitam de validação junto das contas de distribuição antes de lançar.
