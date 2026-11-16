package mz.mrbow.plataforma.publicacoes;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import mz.mrbow.plataforma.artistas.ServicoArtistas;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController @RequestMapping("/api/v1/publicacoes")
@Tag(name="Publicações",description="Feed público de Mr. Bow")
public class ControladorPublicacoes {
  private final ClienteSupabase cliente;
  private final ServicoArtistas artistas;
  public ControladorPublicacoes(ClienteSupabase cliente,ServicoArtistas artistas) {
    this.cliente=cliente; this.artistas=artistas;
  }
  @GetMapping @Operation(summary="Listar publicações públicas recentes")
  public List<Publicacao> listar() {
    return cliente.consultar("posts",Map.of(
      "select","id,title,body,media_url,category,published_at",
      "artist_id","eq."+artistas.identificadorArtista(),
      "status","eq.published","visibility","eq.public",
      "order","published_at.desc","limit","30"),null)
      .stream().map(Publicacao::de).toList();
  }
}
