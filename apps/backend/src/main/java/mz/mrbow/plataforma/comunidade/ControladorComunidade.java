package mz.mrbow.plataforma.comunidade;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import mz.mrbow.plataforma.artistas.ServicoArtistas;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import mz.mrbow.plataforma.seguranca.FaAutenticado;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/v1/comunidade")
@Tag(name="Comunidade",description="Adesão gratuita à comunidade")
public class ControladorComunidade {
  private final ClienteSupabase cliente;
  private final ServicoArtistas artistas;
  public ControladorComunidade(ClienteSupabase cliente,ServicoArtistas artistas) {
    this.cliente=cliente; this.artistas=artistas;
  }

  @GetMapping("/adesao") @Operation(summary="Consultar adesão do fã autenticado")
  public Map<String,Object> adesao(@AuthenticationPrincipal FaAutenticado fa) {
    var registos=cliente.consultar("artist_memberships",Map.of(
      "select","nivel:level,dataAdesao:joined_at",
      "artist_id","eq."+artistas.identificadorArtista(),
      "user_id","eq."+fa.identificador(),"limit","1"),fa.token());
    return registos.isEmpty()?Map.of("aderiu",false):
      Map.of("aderiu",true,"adesao",registos.getFirst());
  }

  @PostMapping("/adesao") @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary="Aderir como fã; o servidor fixa o nível e os pontos")
  public Map<String,Object> aderir(@AuthenticationPrincipal FaAutenticado fa) {
    cliente.inserir("artist_memberships",Map.of(
      "artist_id",artistas.identificadorArtista().toString(),
      "user_id",fa.identificador().toString(),
      "level","fan","points",0),fa.token(),false);
    return Map.of("aderiu",true,"mensagem","Adesão registada.");
  }
}
