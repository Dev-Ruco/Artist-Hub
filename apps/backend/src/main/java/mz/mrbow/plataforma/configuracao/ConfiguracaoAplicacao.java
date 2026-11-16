package mz.mrbow.plataforma.configuracao;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Regista a configuração externa para produção e desenvolvimento. */
@Configuration
@EnableConfigurationProperties(ConfiguracaoSupabase.class)
public class ConfiguracaoAplicacao {}
