package mz.mrbow.plataforma.seguranca;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Verifica cada token Bearer com Supabase Auth (/auth/v1/user).
 * Não aceita identidades ou cargos fornecidos em cabeçalhos arbitrários.
 */
public class FiltroAutenticacao extends OncePerRequestFilter {
    private final ClienteSupabase cliente;

    public FiltroAutenticacao(ClienteSupabase cliente) {
        this.cliente = cliente;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest pedido, HttpServletResponse resposta, FilterChain cadeia)
        throws ServletException, IOException {
        String autorizacao = pedido.getHeader("Authorization");
        if (autorizacao == null || !autorizacao.startsWith("Bearer ")) {
            cadeia.doFilter(pedido, resposta);
            return;
        }
        String token = autorizacao.substring(7).trim();
        if (token.isBlank()) {
            naoAutorizado(resposta);
            return;
        }
        try {
            Map<String, Object> utilizador = cliente.autenticar(token);
            Object identificador = utilizador.get("id");
            if (!(identificador instanceof String codigo)) {
                naoAutorizado(resposta);
                return;
            }
            UUID id = UUID.fromString(codigo);
            String correio = utilizador.get("email") instanceof String valor ? valor : "";
            FaAutenticado fa = new FaAutenticado(id, correio, token);
            var autenticacao = UsernamePasswordAuthenticationToken.authenticated(
                fa, null, List.of(new SimpleGrantedAuthority("ROLE_FA")));
            SecurityContextHolder.getContext().setAuthentication(autenticacao);
            cadeia.doFilter(pedido, resposta);
        } catch (RestClientResponseException erro) {
            if (erro.getStatusCode().is4xxClientError()) {
                naoAutorizado(resposta);
            } else {
                servicoIndisponivel(resposta);
            }
        } catch (ResourceAccessException erro) {
            servicoIndisponivel(resposta);
        } catch (IllegalArgumentException erro) {
            naoAutorizado(resposta);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void naoAutorizado(HttpServletResponse resposta) throws IOException {
        resposta.setStatus(401);
        resposta.setContentType("application/json; charset=UTF-8");
        resposta.getWriter().write("{\"erro\":\"SESSAO_INVALIDA\"}");
    }

    private void servicoIndisponivel(HttpServletResponse resposta) throws IOException {
        resposta.setStatus(503);
        resposta.setContentType("application/json; charset=UTF-8");
        resposta.getWriter().write("{\"erro\":\"AUTENTICACAO_INDISPONIVEL\"}");
    }
}
