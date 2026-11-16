/**
 * Identidade da aplicação publicada.
 * Cada artista recebe uma compilação própria. Os componentes de negócio
 * continuam reutilizáveis; não existe selector público de artistas.
 *
 * Ao criar outra aplicação, definir EXPO_PUBLIC_ARTIST_SLUG e
 * EXPO_PUBLIC_ARTIST_NAME no respectivo ambiente de compilação.
 */
export const BRAND_ARTIST_SLUG = (process.env.EXPO_PUBLIC_ARTIST_SLUG || 'mr-bow').trim().toLowerCase();
export const BRAND_ARTIST_NAME = (process.env.EXPO_PUBLIC_ARTIST_NAME || 'Mr. Bow').trim();
