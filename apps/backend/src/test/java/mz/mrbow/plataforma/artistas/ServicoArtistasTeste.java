package mz.mrbow.plataforma.artistas;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mz.mrbow.plataforma.configuracao.ConfiguracaoSupabase;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

/** Testa a lógica sem rede e sem modificar a instância PostgreSQL. */
class ServicoArtistasTeste {
  private final ClienteSupabase cliente=mock(ClienteSupabase.class);
  private final ConfiguracaoSupabase configuracao=
    new ConfiguracaoSupabase("https://supabase.exemplo.pt","anon-de-teste",
                             "mrbowapp","mr-bow");
  private final ServicoArtistas servico=new ServicoArtistas(cliente,configuracao);

  @Test void devolveArtistaComContratoEmPortugues() {
    UUID id=UUID.randomUUID();
    when(cliente.consultar(eq("artists"),anyMap(),isNull()))
      .thenReturn(List.of(Map.of("id",id.toString(),"slug","mr-bow",
        "display_name","Mr. Bow","accent_color","#F1AC42","is_verified",false)));
    Artista resultado=servico.obterArtista();
    assertEquals("Mr. Bow",resultado.nome());
    assertEquals("mr-bow",resultado.codigo());
    assertEquals(id,resultado.identificador());
    assertFalse(resultado.verificado());
    verify(cliente).consultar(eq("artists"),argThat(filtros->
      "eq.mr-bow".equals(filtros.get("slug")) && "eq.active".equals(filtros.get("status"))),
      isNull());
  }

  @Test void naoInventaArtistaQuandoBaseEstaVazia() {
    when(cliente.consultar(eq("artists"),anyMap(),isNull())).thenReturn(List.of());
    assertThrows(ResponseStatusException.class,servico::obterArtista);
  }
}
