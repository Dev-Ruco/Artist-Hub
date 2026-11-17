package mz.mrbow.plataforma.comum;

import java.time.Instant;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;

/** Mensagens previsíveis sem expor tokens, SQL ou respostas internas do servidor. */
@RestControllerAdvice
public class TratadorErros {
    private static final Logger registo = LoggerFactory.getLogger(TratadorErros.class);
    private static final Pattern CODIGO_ERRO = Pattern.compile("\\\"code\\\"\\s*:\\s*\\\"([A-Za-z0-9_]{1,30})\\\"");

    /**
     * Regista apenas o código técnico do PostgREST, não o corpo da resposta,
     * JWT, chave de API, passwords nem dados pessoais.
     */
    private static String codigoSeguro(RestClientResponseException erro) {
        var correspondencia = CODIGO_ERRO.matcher(erro.getResponseBodyAsString());
        return correspondencia.find() ? correspondencia.group(1) : "NAO_DISPONIVEL";
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validar(MethodArgumentNotValidException erro) {
        return mensagem(HttpStatus.BAD_REQUEST, "DADOS_INVALIDOS",
            "Verifica os campos obrigatórios e os limites indicados.");
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<Map<String, Object>> servicoDados(RestClientResponseException erro) {
        registo.warn("Supabase recusou a consulta: HTTP {}, codigo {}.",
            erro.getStatusCode().value(), codigoSeguro(erro));
        HttpStatus estado = erro.getStatusCode().value() == 409
            ? HttpStatus.CONFLICT : HttpStatus.BAD_GATEWAY;
        return mensagem(estado, "ERRO_SERVICO_DADOS",
            "Não foi possível concluir a operação no serviço de dados.");
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, Object>> indisponivel(ResourceAccessException erro) {
        return mensagem(HttpStatus.SERVICE_UNAVAILABLE, "SERVICO_INDISPONIVEL",
            "O serviço de dados está temporariamente indisponível.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> argumento(IllegalArgumentException erro) {
        return mensagem(HttpStatus.BAD_REQUEST, "PEDIDO_INVALIDO", "Pedido inválido.");
    }

    private ResponseEntity<Map<String, Object>> mensagem(
        HttpStatus estado, String codigo, String detalhe) {
        return ResponseEntity.status(estado).body(Map.of(
            "erro", codigo, "detalhe", detalhe, "instante", Instant.now().toString()));
    }
}
