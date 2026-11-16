package mz.mrbow.plataforma.perfis;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import mz.mrbow.plataforma.seguranca.FaAutenticado;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api/v1/perfil")
@Tag(name="Perfil",description="Dados privados do fã")
public class ControladorPerfil {
  private final ClienteSupabase cliente;
  public ControladorPerfil(ClienteSupabase cliente) { this.cliente=cliente; }
  public record AlteracaoNome(@NotBlank @Size(min=2,max=80) String nome) {}

  @GetMapping @Operation(summary="Consultar o próprio perfil")
  public Map<String,Object> consultar(@AuthenticationPrincipal FaAutenticado fa) {
    var perfis=cliente.consultar("profiles",Map.of(
      "select","identificador:user_id,nome:display_name,fotografia:avatar_url",
      "user_id","eq."+fa.identificador(),"limit","1"),fa.token());
    return perfis.isEmpty() ? Map.of() : perfis.getFirst();
  }

  @PatchMapping @Operation(summary="Alterar nome do próprio perfil")
  public Map<String,Object> alterar(@AuthenticationPrincipal FaAutenticado fa,
      @Valid @RequestBody AlteracaoNome alteracao) {
    var perfis=cliente.inserir("profiles",Map.of(
      "user_id",fa.identificador().toString(),"display_name",alteracao.nome().trim()),
      fa.token(),true);
    if(perfis.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
      "Não foi possível actualizar o perfil.");
    return Map.of("nome",perfis.getFirst().get("display_name"));
  }
}
