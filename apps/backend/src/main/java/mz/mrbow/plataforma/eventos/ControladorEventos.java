package mz.mrbow.plataforma.eventos;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import mz.mrbow.plataforma.artistas.ServicoArtistas;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController @RequestMapping("/api/v1/eventos")
@Tag(name="Eventos",description="Agenda pública de Mr. Bow")
public class ControladorEventos {
  private final ClienteSupabase cliente;
  private final ServicoArtistas artistas;
  public ControladorEventos(ClienteSupabase cliente,ServicoArtistas artistas) {
    this.cliente=cliente; this.artistas=artistas;
  }
  @GetMapping @Operation(summary="Listar próximos eventos publicados")
  public List<Evento> listar() {
    return cliente.consultar("events",Map.of(
      "select","id,title,venue,city,starts_at,ticket_url",
      "artist_id","eq."+artistas.identificadorArtista(),
      "status","eq.published","starts_at","gte."+Instant.now(),
      "order","starts_at.asc","limit","30"),null)
      .stream().map(Evento::de).toList();
  }
}
