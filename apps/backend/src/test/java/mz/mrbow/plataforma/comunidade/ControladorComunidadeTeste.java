package mz.mrbow.plataforma.comunidade;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mz.mrbow.plataforma.artistas.ServicoArtistas;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import mz.mrbow.plataforma.seguranca.FaAutenticado;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Os dados de participação não vêm de um formulário controlado pelo fã.
 * Uma adesão nova nunca pode criar cargos VIP ou pontos arbitrários.
 */
class ControladorComunidadeTeste {
    @Test
    void adesaoDefineNivelGratuitoSemAceitarPrivilegiosDoCliente() {
        var cliente = mock(ClienteSupabase.class);
        var artistas = mock(ServicoArtistas.class);
        UUID artista = UUID.randomUUID();
        UUID utilizador = UUID.randomUUID();
        when(artistas.identificadorArtista()).thenReturn(artista);
        when(cliente.inserir(eq("artist_memberships"), anyMap(), eq("token-valido"), eq(false)))
            .thenReturn(List.of());
        var controlador = new ControladorComunidade(cliente, artistas);
        var fa = new FaAutenticado(utilizador, "fa@exemplo.pt", "token-valido");

        var resultado = controlador.aderir(fa);
        assertEquals(true, resultado.get("aderiu"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> dados = ArgumentCaptor.forClass(Map.class);
        verify(cliente).inserir(eq("artist_memberships"), dados.capture(),
            eq("token-valido"), eq(false));
        assertEquals("fan", dados.getValue().get("level"));
        assertEquals(0, dados.getValue().get("points"));
        assertEquals(utilizador.toString(), dados.getValue().get("user_id"));
        assertEquals(artista.toString(), dados.getValue().get("artist_id"));
        assertFalse(dados.getValue().containsKey("role"));
    }

    @Test
    void consultaSempreRestringeAdesaoAoUtilizadorAutenticado() {
        var cliente = mock(ClienteSupabase.class);
        var artistas = mock(ServicoArtistas.class);
        UUID artista = UUID.randomUUID();
        UUID utilizador = UUID.randomUUID();
        when(artistas.identificadorArtista()).thenReturn(artista);
        when(cliente.consultar(eq("artist_memberships"), anyMap(), eq("token-seguro")))
            .thenReturn(List.of());
        var controlador = new ControladorComunidade(cliente, artistas);
        var resposta = controlador.adesao(new FaAutenticado(utilizador, "", "token-seguro"));
        assertEquals(false, resposta.get("aderiu"));
        verify(cliente).consultar(eq("artist_memberships"), argThat(filtros ->
            ("eq." + utilizador).equals(filtros.get("user_id"))
            && ("eq." + artista).equals(filtros.get("artist_id"))), eq("token-seguro"));
    }
}
