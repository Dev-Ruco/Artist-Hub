package mz.mrbow.plataforma;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Ponto de entrada do backend. A aplicação móvel nunca acede directamente
 * às tabelas quando utiliza esta API.
 */
@SpringBootApplication
public class AplicacaoMrBow {
    public static void main(String[] argumentos) {
        SpringApplication.run(AplicacaoMrBow.class, argumentos);
    }
}
