# Hero editorial do Artist Hub — referência e preparação fotográfica

## Intenção visual
A secção principal inspira-se na referência enviada pelo cliente (aplicação Jah Prayzah): área vertical de grande impacto, fotografia do artista ao fundo, nome em tipografia alta e condensada, botões arredondados e secção de novidades imediatamente abaixo.

Não reutilizamos a fotografia, o nome ou os elementos gráficos do artista de referência.

## Implementação
- `apps/mobile/src/components/HomeHero.tsx`: componente reutilizável e responsivo.
- Fotografia configurável a partir de `artist.banner_url`, preservando a arquitectura multiartista.
- Sem fotografia: composição temporária com gradientes e monograma do artista, assinalada como provisória.
- Saudações adaptadas à hora local; o nome só aparece quando existir no perfil autenticado.
- Acções efectivas: **Novidades** desloca a página e **Comunidade** abre o separador correspondente.
- Ecrã inicial com cartões de novidades, filtro/selector de artistas e dados de demonstração identificados.
- O piloto usa o nome Mr. Bow apenas como exemplo visual, sem atribuir conteúdos ou eventos reais ao artista.

## Fotografia a fornecer
A fotografia de Mr. Bow deverá:
- estar autorizada para utilização no projecto;
- ser vertical, preferencialmente 3:4 ou 4:5, com boa resolução;
- ter o artista no lado direito e espaço livre no lado esquerdo para o texto;
- estar isenta de legendas e marcas de água.

Quando for recebida, podemos alojá-la num bucket de media autorizado e preencher o `banner_url` do artista. O componente utiliza `resizeMode="cover"` e uma camada de gradiente de contraste.

## Revisão antes do lançamento
Validar o recorte da imagem em dispositivos de 320 a 430 px, iPhone, Android e desktop; confirmar contraste da tipografia, controlo de permissões de imagem e navegação por acessibilidade.

## Fotografia principal incorporada — 14/11/2026

- Fotografia original recebida em `apps/mobile/assets/artists/mr-bow/MR BOW SETION.jpeg`.
- Referência optimizada para utilização em código: `apps/mobile/assets/artists/mr-bow/hero.jpeg`. Trata-se do **mesmo conteúdo binário**, sem edição, recorte permanente nem alteração do rosto ou das proporções.
- `HomeHero` apresenta `hero.jpeg` quando o artista activo tem `slug = 'mr-bow'` e não existe `banner_url` externo; um `banner_url` explícito mantém precedência.
- A apresentação usa `resizeMode='cover'`, com gradientes para legibilidade e enquadramento ajustado ao tamanho do ecrã. O ficheiro original permanece intacto.
