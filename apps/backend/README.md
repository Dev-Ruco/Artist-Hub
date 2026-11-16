# Plataforma API de Mr. Bow

**Backend modular em Java 21, Spring Boot 4.1.2 e API REST em português.**

A mesma API poderá servir a aplicação Android/iOS, um website e um painel de administração. O produto distribuído actualmente é exclusivo de Mr. Bow, embora o código técnico possa ser reutilizado noutros projectos.

## Organização

```text
apps/backend/
├── pom.xml                    Dependências Maven
├── Dockerfile                 Compilação multi-etapa
├── .env.exemplo               Modelo das variáveis
└── src/
    ├── main/java/mz/mrbow/plataforma/
    │   ├── AplicacaoMrBow.java
    │   ├── configuracao/
    │   ├── seguranca/
    │   ├── integracoes/
    │   ├── artistas/
    │   ├── publicacoes/
    │   ├── eventos/
    │   ├── contas/
    │   ├── perfis/
    │   ├── comunidade/
    │   ├── perguntas/
    │   ├── chamadas/
    │   └── comum/
    └── test/java/             Testes automatizados
```

## Instalar e executar

1. Ter Java 21 e Maven instalados.
2. Configurar as variáveis no teu sistema (ver `.env.exemplo`).
3. Correr `mvn test` e `mvn spring-boot:run`.
4. Testar `http://localhost:8080/actuator/health`.
5. Testar `http://localhost:8080/api/v1/artista`.
6. Abrir `http://localhost:8080/swagger-ui.html`.

O endpoint de saúde só prova que o processo Java arrancou. O endpoint do artista verifica o acesso efectivo ao Supabase.

## Configuração

| Variável | Utilidade |
|---|---|
| `PORTA_API` | Porta interna da API, normalmente 8080 |
| `SUPABASE_ENDERECO` | Endereço da instalação Supabase |
| `SUPABASE_CHAVE_ANONIMA` | Chave pública anon, **nunca** service_role |
| `ORIGENS_PERMITIDAS` | Origens Web autorizadas a chamar a API |

As variáveis reais são definidas no Coolify ou no ambiente local. Não devem ser enviadas para o repositório.

## Mais informações

- [Arquitectura explicada para portefólio](../../docs/arquitectura-api-java.md).
- [Guia de publicação no Coolify](../../docs/publicar-api-java-coolify.md).
- [Aplicação React Native](../mobile).

O backend comunica com o esquema `mrbowapp` através do serviço PostgREST, preservando as regras RLS existentes e sem efectuar alterações directas à base partilhada.
