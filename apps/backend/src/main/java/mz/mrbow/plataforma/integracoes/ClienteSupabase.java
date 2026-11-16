package mz.mrbow.plataforma.integracoes;

import java.util.List;
import java.util.Map;
import mz.mrbow.plataforma.configuracao.ConfiguracaoSupabase;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

/**
 * Adaptador de persistência sobre PostgREST e Supabase Auth.
 *
 * Porquê: aproveita as políticas RLS existentes em mrbowapp sem criar
 * um utilizador PostgreSQL com BYPASSRLS na instância partilhada.
 *
 * Este componente é a única classe que conhece os endereços do Supabase.
 * Poderá ser substituído por um adaptador JDBC de privilégios mínimos
 * sem alterar os controladores nem a API dos clientes.
 */
@Component
public class ClienteSupabase {
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LISTA =
        new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<Map<String, Object>> OBJECTO =
        new ParameterizedTypeReference<>() {};

    private final RestClient cliente;
    private final ConfiguracaoSupabase configuracao;

    public ClienteSupabase(RestClient.Builder construtor, ConfiguracaoSupabase configuracao) {
        this.configuracao = configuracao;
        this.cliente = construtor.baseUrl(configuracao.endereco())
            .defaultHeader("apikey", configuracao.chaveAnonima())
            .build();
    }

    public List<Map<String, Object>> consultar(
        String tabela, Map<String, String> filtros, String token) {
        var resposta = cliente.get()
            .uri(construtor -> {
                UriBuilder endereco = construtor.path("/rest/v1/{tabela}");
                filtros.forEach(endereco::queryParam);
                return endereco.build(tabela);
            })
            .header("Accept-Profile", configuracao.esquema())
            .headers(cabecalhos -> cabecalhos.setBearerAuth(credencial(token)))
            .retrieve().body(LISTA);
        return resposta == null ? List.of() : resposta;
    }

    public List<Map<String, Object>> inserir(
        String tabela, Map<String, ?> dados, String token, boolean actualizarDuplicado) {
        var resposta = cliente.post()
            .uri(construtor -> actualizarDuplicado
                ? construtor.path("/rest/v1/{tabela}").queryParam("on_conflict", "user_id").build(tabela)
                : construtor.path("/rest/v1/{tabela}").build(tabela))
            .contentType(MediaType.APPLICATION_JSON)
            .header("Content-Profile", configuracao.esquema())
            .header("Prefer", actualizarDuplicado
                ? "resolution=merge-duplicates,return=representation"
                : "return=representation")
            .headers(cabecalhos -> cabecalhos.setBearerAuth(credencial(token)))
            .body(dados).retrieve().body(LISTA);
        return resposta == null ? List.of() : resposta;
    }

    public List<Map<String, Object>> executarFuncao(
        String nome, Map<String, ?> argumentos, String token) {
        var resposta = cliente.post().uri("/rest/v1/rpc/{nome}", nome)
            .contentType(MediaType.APPLICATION_JSON)
            .header("Content-Profile", configuracao.esquema())
            .headers(cabecalhos -> cabecalhos.setBearerAuth(credencial(token)))
            .body(argumentos).retrieve().body(LISTA);
        return resposta == null ? List.of() : resposta;
    }

    public Map<String, Object> autenticar(String token) {
        var resposta = cliente.get().uri("/auth/v1/user")
            .headers(cabecalhos -> cabecalhos.setBearerAuth(token))
            .retrieve().body(OBJECTO);
        return resposta == null ? Map.of() : resposta;
    }

    public Map<String, Object> enviarAutenticacao(String caminho, Map<String, ?> dados) {
        var resposta = cliente.post().uri("/auth/v1/{caminho}", caminho)
            .contentType(MediaType.APPLICATION_JSON)
            .body(dados).retrieve().body(OBJECTO);
        return resposta == null ? Map.of() : resposta;
    }

    public Map<String, Object> obterSessao(String tipo, Map<String, ?> dados) {
        var resposta = cliente.post()
            .uri(construtor -> construtor.path("/auth/v1/token")
                .queryParam("grant_type", tipo).build())
            .contentType(MediaType.APPLICATION_JSON)
            .body(dados).retrieve().body(OBJECTO);
        return resposta == null ? Map.of() : resposta;
    }

    private String credencial(String token) {
        return token == null || token.isBlank() ? configuracao.chaveAnonima() : token;
    }
}
