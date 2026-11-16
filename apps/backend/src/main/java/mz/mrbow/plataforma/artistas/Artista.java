package mz.mrbow.plataforma.artistas;
import java.util.Map;
import java.util.UUID;
/** Resposta pública da API, independente dos nomes das colunas na base de dados. */
public record Artista(UUID identificador, String codigo, String nome, String descricao,
                      String fotografia, String capa, String corDestaque, boolean verificado) {
  public static Artista de(Map<String,Object> dados) {
    return new Artista(UUID.fromString((String) dados.get("id")), (String) dados.get("slug"),
      (String) dados.get("display_name"), (String) dados.get("tagline"),
      (String) dados.get("avatar_url"), (String) dados.get("banner_url"),
      (String) dados.get("accent_color"), Boolean.TRUE.equals(dados.get("is_verified")));
  }
}
