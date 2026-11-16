package mz.mrbow.plataforma.chamadas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mz.mrbow.plataforma.artistas.ServicoArtistas;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Consulta informativa: não habilita pagamentos, reservas nem tokens de chamada. */
@RestController @RequestMapping("/api/v1/chamadas")
@Tag(name="Chamadas",description="Serviços e horários; operações financeiras desactivadas")
public class ControladorChamadas {
  private final ClienteSupabase cliente;
  private final ServicoArtistas artistas;
  public ControladorChamadas(ClienteSupabase cliente,ServicoArtistas artistas) {
    this.cliente=cliente;this.artistas=artistas;
  }
  @GetMapping("/servicos") @Operation(summary="Consultar serviços públicos activos")
  public List<Map<String,Object>> servicos() {
    return cliente.consultar("call_services",Map.of(
      "select","identificador:id,tipo:kind,titulo:title,descricao:description,duracaoMinutos:duration_minutes,precoCentimos:price_minor,moeda:currency",
      "artist_id","eq."+artistas.identificadorArtista(),
      "status","eq.active","limit","20"),null);
  }
  @GetMapping("/horarios") @Operation(summary="Consultar horários elegíveis")
  public List<Map<String,Object>> horarios(@RequestParam("servico") UUID servico) {
    return cliente.executarFuncao("list_available_call_slots",Map.of(
      "p_artist_id",artistas.identificadorArtista().toString(),
      "p_service_id",servico.toString()),null);
  }
}
