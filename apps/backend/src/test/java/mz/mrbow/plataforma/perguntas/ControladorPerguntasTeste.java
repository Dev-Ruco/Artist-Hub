package mz.mrbow.plataforma.perguntas;

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

/** Garante que não se pode enviar perguntas em nome de outro utilizador. */
class ControladorPerguntasTeste {
    @Test
    void pedidoGratuitoUsaIdentidadeValidadaPelaAutenticacao() {
        var cliente = mock(ClienteSupabase.class);
        var artistas = mock(ServicoArtistas.class);
        UUID artista = UUID.randomUUID();
        UUID fa = UUID.randomUUID();
        when(artistas.identificadorArtista()).thenReturn(artista);
        when(cliente.inserir(eq("message_requests"), anyMap(), eq("token"), eq(false)))
            .thenReturn(List.of(Map.of("id", UUID.randomUUID().toString())));
        var controlador = new ControladorPerguntas(cliente, artistas);
        var resposta = controlador.enviar(new FaAutenticado(fa, "fa@exemplo.pt", "token"),
            new ControladorPerguntas.NovaPergunta("Qual é a próxima música?"));
        assertEquals(1, resposta.size());
        verify(cliente).inserir(eq("message_requests"), argThat(dados ->
            fa.toString().equals(dados.get("fan_id"))
            && artista.toString().equals(dados.get("artist_id"))
            && "free".equals(dados.get("request_type"))
            && "pending".equals(dados.get("status"))),
            eq("token"), eq(false));
    }
}
