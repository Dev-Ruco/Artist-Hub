package mz.mrbow.plataforma.comum;

import java.time.Instant;
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
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validar(MethodArgumentNotValidException erro) {
        return mensagem(HttpStatus.BAD_REQUEST, "DADOS_INVALIDOS",
            "Verifica os campos obrigatórios e os limites indicados.");
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<Map<String, Object>> servicoDados(RestClientResponseException erro) {
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
