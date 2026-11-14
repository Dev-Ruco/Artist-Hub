# Fotografias — Mr Bow

Esta pasta recebe as fotografias **autorizadas** de Mr Bow para a aplicação Artist Hub.

## Nomes sugeridos

- `hero.jpg` — fotografia principal para a secção de entrada (preferencialmente vertical, com espaço livre à esquerda).
- `avatar.jpg` — imagem quadrada do perfil.
- `gallery-01.jpg`, `gallery-02.jpg`… — fotografias adicionais para a futura galeria.

## Recomendações

- Hero: JPG ou WEBP, idealmente ≥ 1200 × 1600 píxeis e enquadramento vertical 3:4 ou 4:5.
- Avatar: JPG ou WEBP, preferencialmente quadrado.
- Evitar marcas de água e texto nas fotografias.
- Optimizar os ficheiros para reduzir o tempo de carregamento.
- Não colocar documentos privados, dados pessoais ou imagens sem direitos de utilização.

## Como enviar

No GitHub, abra esta pasta, seleccione **Add file → Upload files**, arraste as imagens e confirme **Commit changes** na branch `main`.

**Nota importante:** o carregamento aqui não altera automaticamente a aplicação. Para usar a imagem no hero, será necessário ligá-la ao componente `HomeHero` (por exemplo, com `require` para recursos locais) ou publicar a fotografia num URL HTTPS e definir o campo `banner_url` do artista. Não substituir a fotografia por uma imagem externa sem autorização.
