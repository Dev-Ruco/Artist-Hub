package mz.mrbow.plataforma.perguntas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import mz.mrbow.plataforma.artistas.ServicoArtistas;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import mz.mrbow.plataforma.seguranca.FaAutenticado;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/v1/perguntas")
@Tag(name="Perguntas",description="Perguntas gratuitas à equipa de Mr. Bow")
public class ControladorPerguntas {
  private final ClienteSupabase cliente;
  private final ServicoArtistas artistas;
  public ControladorPerguntas(ClienteSupabase cliente,ServicoArtistas artistas) {
    this.cliente=cliente;this.artistas=artistas;
  }
  public record NovaPergunta(@NotBlank @Size(min=10,max=1000) String texto) {}

  @GetMapping @Operation(summary="Listar apenas perguntas do utilizador autenticado")
  public List<Map<String,Object>> listar(@AuthenticationPrincipal FaAutenticado fa) {
    return cliente.consultar("message_requests",Map.of(
      "select","identificador:id,texto:body,estado:status,dataCriacao:created_at",
      "artist_id","eq."+artistas.identificadorArtista(),
      "fan_id","eq."+fa.identificador(),
      "order","created_at.desc","limit","40"),fa.token());
  }

  @PostMapping @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary="Enviar pergunta gratuita; limite SQL de três por 24 horas")
  public List<Map<String,Object>> enviar(@AuthenticationPrincipal FaAutenticado fa,
      @Valid @RequestBody NovaPergunta pergunta) {
    return cliente.inserir("message_requests",Map.of(
      "artist_id",artistas.identificadorArtista().toString(),
      "fan_id",fa.identificador().toString(),
      "body",pergunta.texto().trim(),"request_type","free","status","pending"),
      fa.token(),false);
  }
}
