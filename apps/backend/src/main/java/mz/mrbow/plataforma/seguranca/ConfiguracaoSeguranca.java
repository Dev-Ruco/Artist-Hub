package mz.mrbow.plataforma.seguranca;

import java.util.Arrays;
import mz.mrbow.plataforma.integracoes.ClienteSupabase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class ConfiguracaoSeguranca {
    @Bean
    public SecurityFilterChain cadeiaSeguranca(HttpSecurity http, ClienteSupabase cliente)
        throws Exception {
        return http.csrf(proteccao -> proteccao.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sessoes ->
                sessoes.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(regras -> regras
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/artista",
                    "/api/v1/publicacoes", "/api/v1/eventos",
                    "/api/v1/chamadas/servicos", "/api/v1/chamadas/horarios").permitAll()
                .requestMatchers(HttpMethod.POST,
                    "/api/v1/contas/entrar", "/api/v1/contas/registar",
                    "/api/v1/contas/renovar", "/api/v1/contas/recuperar").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(erros -> erros.authenticationEntryPoint(
                (pedido, resposta, excecao) -> {
                    resposta.setStatus(401);
                    resposta.setContentType("application/json; charset=UTF-8");
                    resposta.getWriter().write("{\"erro\":\"AUTENTICACAO_OBRIGATORIA\"}");
                }))
            .addFilterBefore(new FiltroAutenticacao(cliente),
                UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource cors(
        @Value("${plataforma.seguranca.origens-permitidas}") String origens) {
        CorsConfiguration regras = new CorsConfiguration();
        regras.setAllowedOrigins(Arrays.stream(origens.split(","))
            .map(String::trim).filter(valor -> !valor.isEmpty()).toList());
        regras.setAllowedMethods(java.util.List.of("GET", "POST", "PATCH", "OPTIONS"));
        regras.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "Accept"));
        regras.setAllowCredentials(false);
        regras.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/api/**", regras);
        return fonte;
    }
}
