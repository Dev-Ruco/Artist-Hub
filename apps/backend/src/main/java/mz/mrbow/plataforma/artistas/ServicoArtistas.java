package mz.mrbow.plataforma.artistas;
import java.util.Map;
import java.util.UUID;
import mz.mrbow.plataforma.configuracao.ConfiguracaoSupabase;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
/** Uma distribuição da API representa exclusivamente um artista configurado. */
@Service
public class ServicoArtistas {
  private final ClienteSupabase cliente;
  private final ConfiguracaoSupabase configuracao;
  public ServicoArtistas(ClienteSupabase cliente, ConfiguracaoSupabase configuracao) {
    this.cliente = cliente; this.configuracao = configuracao;
  }
  public Artista obterArtista() {
    var resultados = cliente.consultar("artists", Map.of(
      "select","id,slug,display_name,tagline,avatar_url,banner_url,accent_color,is_verified",
      "slug","eq." + configuracao.codigoArtista(),"status","eq.active","limit","1"),null);
    if (resultados.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Artista indisponível.");
    return Artista.de(resultados.getFirst());
  }
  public UUID identificadorArtista() { return obterArtista().identificador(); }
}
