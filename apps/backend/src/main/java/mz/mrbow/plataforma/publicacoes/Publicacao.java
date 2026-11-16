package mz.mrbow.plataforma.publicacoes;
import java.util.Map;
import java.util.UUID;
public record Publicacao(UUID identificador,String titulo,String texto,String enderecoMultimedia,
                         String categoria,String dataPublicacao) {
  public static Publicacao de(Map<String,Object> dados) {
    return new Publicacao(UUID.fromString((String) dados.get("id")),(String)dados.get("title"),
      (String)dados.get("body"),(String)dados.get("media_url"),(String)dados.get("category"),
      (String)dados.get("published_at"));
  }
}
