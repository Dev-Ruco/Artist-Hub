package mz.mrbow.plataforma.contas;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import java.util.Map;
import mz.mrbow.plataforma.configuracao.ConfiguracaoSupabase;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.junit.jupiter.api.Test;

/** Registo destinado apenas à aplicação Mr. Bow. */
class ControladorContasTeste {
    @Test
    void registoAssociaMarcaSemAceitarPapelPrivilegiado() {
        var cliente = mock(ClienteSupabase.class);
        var configuracao = new ConfiguracaoSupabase(
            "https://exemplo.pt", "chave-publica", "mrbowapp", "mr-bow");
        when(cliente.enviarAutenticacao(eq("signup"), anyMap()))
            .thenReturn(Map.of("user", Map.of("id", "utilizador-de-teste")));
        var controlador = new ControladorContas(cliente, configuracao);

        var resultado = controlador.registar(new ControladorContas.Registo(
            " Fa@Exemplo.pt ", "senha-com-seguranca-123", " Maria Silva "));
        assertEquals(true, resultado.get("registoAceite"));
        verify(cliente).enviarAutenticacao(eq("signup"), argThat(dados -> {
            if (!"fa@exemplo.pt".equals(dados.get("email"))) return false;
            Object metadados = dados.get("data");
            if (!(metadados instanceof Map<?, ?> informacao)) return false;
            return "mr-bow".equals(informacao.get("artist_app"))
                && "Maria Silva".equals(informacao.get("full_name"))
                && !informacao.containsKey("role")
                && !informacao.containsKey("vip");
        }));
    }

    @Test
    void recuperacaoNaoConfirmaSeOUtilizadorExiste() {
        var cliente = mock(ClienteSupabase.class);
        var controlador = new ControladorContas(cliente,
            new ConfiguracaoSupabase("https://exemplo.pt", "anon", "mrbowapp", "mr-bow"));
        var resultado = controlador.recuperar(
            new ControladorContas.Recuperacao("Pessoa@Exemplo.pt"));
        assertTrue(((String) resultado.get("mensagem")).startsWith("Se o endereço"));
        verify(cliente).enviarAutenticacao("recover", Map.of("email", "pessoa@exemplo.pt"));
    }
}
