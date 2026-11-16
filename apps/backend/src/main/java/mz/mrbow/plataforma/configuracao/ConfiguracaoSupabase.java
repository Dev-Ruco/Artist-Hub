package mz.mrbow.plataforma.configuracao;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Cada instalação pode utilizar um Supabase distinto, sem alterar o código.
 * A chave anon é usada pelo backend; nunca é uma chave service_role.
 */
@Validated
@ConfigurationProperties(prefix = "plataforma.supabase")
public record ConfiguracaoSupabase(
    @NotBlank String endereco,
    @NotBlank String chaveAnonima,
    @NotBlank String esquema,
    @NotBlank String codigoArtista
) {}
