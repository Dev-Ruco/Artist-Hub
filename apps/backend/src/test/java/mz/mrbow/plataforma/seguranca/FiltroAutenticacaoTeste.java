package mz.mrbow.plataforma.seguranca;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Map;
import java.util.UUID;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.HttpStatus;

class FiltroAutenticacaoTeste {
  private final ClienteSupabase cliente=mock(ClienteSupabase.class);
  private final FiltroAutenticacao filtro=new FiltroAutenticacao(cliente);

  @Test void rejeitaTokenQueSupabaseNaoReconhece() throws Exception {
    when(cliente.autenticar("token-invalido")).thenThrow(
      new HttpClientErrorException(HttpStatus.UNAUTHORIZED));
    var pedido=new MockHttpServletRequest("GET","/api/v1/perfil");
    pedido.addHeader("Authorization","Bearer token-invalido");
    var resposta=new MockHttpServletResponse();
    filtro.doFilter(pedido,resposta,new MockFilterChain());
    assertEquals(401,resposta.getStatus());
    assertTrue(resposta.getContentAsString().contains("SESSAO_INVALIDA"));
  }

  @Test void aceitaApenasUtilizadorIdentificadoPeloSupabaseAuth() throws Exception {
    UUID id=UUID.randomUUID();
    when(cliente.autenticar("token-valido"))
      .thenReturn(Map.of("id",id.toString(),"email","fa@exemplo.pt"));
    var pedido=new MockHttpServletRequest("GET","/api/v1/perfil");
    pedido.addHeader("Authorization","Bearer token-valido");
    var resposta=new MockHttpServletResponse();
    var cadeia=new MockFilterChain();
    filtro.doFilter(pedido,resposta,cadeia);
    assertNotNull(cadeia.getRequest());
    assertEquals(200,resposta.getStatus());
    assertNull(SecurityContextHolder.getContext().getAuthentication());
  }
}
