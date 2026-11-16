-- INSTALADOR DESCONTINUADO PARA ESTE PROJECTO.
-- O utilizador confirmou que o esquema existente no Supabase self-hosted
-- se chama mrbowapp e nao artist_hub.
--
-- UTILIZAR APENAS:
-- infra/supabase/install_mrbowapp_existing_schema.sql
--
-- Este ficheiro termina de proposito com erro, sem escrever na base de dados.
DO $blocked$
BEGIN
  RAISE EXCEPTION
    'Instalador obsoleto. Utilizar infra/supabase/install_mrbowapp_existing_schema.sql para o esquema mrbowapp.';
END
$blocked$;
