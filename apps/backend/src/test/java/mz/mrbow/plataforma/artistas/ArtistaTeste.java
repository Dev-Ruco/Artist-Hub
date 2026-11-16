package mz.mrbow.plataforma.artistas;

import static org.junit.jupiter.api.Assertions.*;
import java.util.HashMap;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ArtistaTeste {
  @Test void aceitaColunasNulasEExplicaCamposNaResposta() {
    var dados=new HashMap<String,Object>();
    var identificador=UUID.randomUUID();
    dados.put("id",identificador.toString());
    dados.put("slug","mr-bow");
    dados.put("display_name","Mr. Bow");
    dados.put("tagline",null);
    dados.put("avatar_url",null);
    dados.put("banner_url",null);
    dados.put("accent_color","#A9E96C");
    dados.put("is_verified",false);
    var artista=Artista.de(dados);
    assertEquals(identificador,artista.identificador());
    assertNull(artista.fotografia());
    assertFalse(artista.verificado());
  }
}
