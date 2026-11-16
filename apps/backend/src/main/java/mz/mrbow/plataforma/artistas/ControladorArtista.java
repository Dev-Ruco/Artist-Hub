package mz.mrbow.plataforma.artistas;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/v1/artista")
@Tag(name="Artista", description="Identidade pública de Mr. Bow")
public class ControladorArtista {
  private final ServicoArtistas servico;
  public ControladorArtista(ServicoArtistas servico) { this.servico = servico; }
  @GetMapping @Operation(summary="Consultar o artista activo")
  public Artista consultar() { return servico.obterArtista(); }
}
