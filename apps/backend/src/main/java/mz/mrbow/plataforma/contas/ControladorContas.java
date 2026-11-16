package mz.mrbow.plataforma.contas;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashMap;
import java.util.Map;
import mz.mrbow.plataforma.configuracao.ConfiguracaoSupabase;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import mz.mrbow.plataforma.seguranca.FaAutenticado;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

/** O React Native comunica apenas com a API Java; a palavra-passe é tratada pelo Supabase Auth. */
@RestController @RequestMapping("/api/v1/contas")
@Tag(name="Contas",description="Registo e autenticação dos fãs")
public class ControladorContas {
  private final ClienteSupabase cliente;
  private final ConfiguracaoSupabase configuracao;
  public ControladorContas(ClienteSupabase cliente,ConfiguracaoSupabase configuracao) {
    this.cliente=cliente; this.configuracao=configuracao;
  }
  public record Credenciais(@NotBlank @Email String correio,@NotBlank String palavraPasse) {}
  public record Registo(@NotBlank @Email String correio,
    @NotBlank @Size(min=8,max=128) String palavraPasse,
    @NotBlank @Size(min=2,max=80) String nome) {}
  public record Renovacao(@NotBlank String tokenRenovacao) {}
  public record Recuperacao(@NotBlank @Email String correio) {}

  @PostMapping("/entrar") @Operation(summary="Iniciar sessão")
  public Map<String,Object> entrar(@Valid @RequestBody Credenciais credenciais) {
    try {
      return formatarSessao(cliente.obterSessao("password",Map.of(
        "email",credenciais.correio().trim().toLowerCase(),
        "password",credenciais.palavraPasse())));
    } catch (RestClientResponseException erro) {
      if (erro.getStatusCode().is4xxClientError()) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Credenciais inválidas.");
      }
      throw erro;
    }
  }

  @PostMapping("/registar") @ResponseStatus(HttpStatus.ACCEPTED)
  @Operation(summary="Registar fã, com confirmação por correio se estiver configurada")
  public Map<String,Object> registar(@Valid @RequestBody Registo registo) {
    try {
      var resposta=cliente.enviarAutenticacao("signup",Map.of(
        "email",registo.correio().trim().toLowerCase(),
        "password",registo.palavraPasse(),
        "data",Map.of("full_name",registo.nome().trim(),
                      "artist_app",configuracao.codigoArtista())));
      var resultado=new LinkedHashMap<String,Object>();
      resultado.put("registoAceite",true);
      resultado.put("confirmacaoPorCorreio",!resposta.containsKey("access_token"));
      if(resposta.containsKey("access_token")) resultado.putAll(formatarSessao(resposta));
      return resultado;
    } catch (RestClientResponseException erro) {
      if(erro.getStatusCode().is4xxClientError()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Não foi possível concluir o registo. Verifica os dados.");
      }
      throw erro;
    }
  }

  @PostMapping("/renovar") @Operation(summary="Renovar sessão")
  public Map<String,Object> renovar(@Valid @RequestBody Renovacao pedido) {
    try {
      return formatarSessao(cliente.obterSessao("refresh_token",
        Map.of("refresh_token",pedido.tokenRenovacao())));
    } catch(RestClientResponseException erro) {
      if(erro.getStatusCode().is4xxClientError()) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Sessão expirada.");
      }
      throw erro;
    }
  }

  @PostMapping("/recuperar") @ResponseStatus(HttpStatus.ACCEPTED)
  @Operation(summary="Pedir recuperação de acesso sem revelar se o correio está registado")
  public Map<String,Object> recuperar(@Valid @RequestBody Recuperacao pedido) {
    try {
      cliente.enviarAutenticacao("recover",Map.of("email",pedido.correio().trim().toLowerCase()));
    } catch(RestClientResponseException erro) {
      if(erro.getStatusCode().is5xxServerError()) throw erro;
    }
    return Map.of("mensagem","Se o endereço estiver registado, receberás instruções por correio electrónico.");
  }

  @PostMapping("/sair") @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary="Terminar sessão e invalidar token de renovação")
  public void sair(@AuthenticationPrincipal FaAutenticado fa) {
    cliente.terminarSessao(fa.token());
  }

  private Map<String,Object> formatarSessao(Map<String,Object> original) {
    var resposta=new LinkedHashMap<String,Object>();
    resposta.put("tokenAcesso",original.get("access_token"));
    resposta.put("tokenRenovacao",original.get("refresh_token"));
    resposta.put("expiraEm",original.get("expires_in"));
    resposta.put("tipo",original.get("token_type"));
    if(original.get("user") instanceof Map<?,?> utilizador) {
      resposta.put("identificadorUtilizador",utilizador.get("id"));
      resposta.put("correio",utilizador.get("email"));
      resposta.put("nome",utilizador.get("user_metadata") instanceof Map<?,?> dados
        ? dados.get("full_name") : null);
    }
    return resposta;
  }
}
