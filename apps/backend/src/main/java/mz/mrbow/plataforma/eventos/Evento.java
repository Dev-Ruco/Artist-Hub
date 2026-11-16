package mz.mrbow.plataforma.eventos;
import java.util.Map;
import java.util.UUID;
public record Evento(UUID identificador,String titulo,String local,String cidade,
                     String dataInicio,String enderecoBilhete) {
  public static Evento de(Map<String,Object> dados) {
    return new Evento(UUID.fromString((String)dados.get("id")),(String)dados.get("title"),
      (String)dados.get("venue"),(String)dados.get("city"),(String)dados.get("starts_at"),
      (String)dados.get("ticket_url"));
  }
}
