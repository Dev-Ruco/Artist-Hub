# Arquitectura Java de Mr. Bow — explicação para portefólio

## 1. Decisão de arquitectura

O produto **Mr. Bow** tem uma aplicação móvel React Native/Expo e uma **API centralizada em Java 21 + Spring Boot 4.1.2**. Futuras interfaces Web e administrativas poderão usar a mesma API. O código está organizado como um **monólito modular**: uma aplicação Java, mas responsabilidades claramente separadas.

```text
          Android/iOS                Web               Administração (futuro)
               │                     │                          │
               └─────────────────────┼──────────────────────────┘
                                     │ HTTPS / REST / JSON
                                     ▼
                          API JAVA — SPRING BOOT
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
             Artistas             Contas             Comunidade
             Publicações          Perfis             Perguntas
             Eventos              Segurança          Chamadas
                  │                  │                  │
                  └──────────────────┼──────────────────┘
                                     ▼
                        Adaptador de dados Supabase
                       PostgREST + Supabase Auth + RLS
                                     │
                                     ▼
                    PostgreSQL self-hosted em Coolify
                       esquema mrbowapp: 18 tabelas
```

**Explicação importante:** a implementação actual não se liga directamente ao PostgreSQL por JDBC. O adaptador Java utiliza o serviço **PostgREST** do Supabase, que aplica as políticas RLS e os JWT das contas. Isto reduz o risco de criar um utilizador privilegiado na base partilhada por outras aplicações. Como o código separa este adaptador dos módulos de negócio, no futuro poderá ser substituído por JDBC com um utilizador dedicado e regras de privilégio mínimo, sem alterar os contratos HTTP.

## 2. Como explicar a organização

A pasta `apps/backend/src/main/java/mz/mrbow/plataforma` contém:

| Módulo | O que faz | Exemplo |
|---|---|---|
| `configuracao` | Lê parâmetros externos, sem os fixar no código | `ConfiguracaoSupabase` |
| `integracoes` | Fala com as infra-estruturas externas | `ClienteSupabase` |
| `seguranca` | Confirma a identidade e decide quem acede a cada rota | `FiltroAutenticacao` |
| `artistas` | Identifica o artista activo desta aplicação | `ServicoArtistas` |
| `publicacoes` | Mostra notícias e bastidores publicados | `ControladorPublicacoes` |
| `eventos` | Mostra os próximos eventos | `ControladorEventos` |
| `contas` | Registo, login, renovação e saída | `ControladorContas` |
| `perfis` | Dados privados do utilizador autenticado | `ControladorPerfil` |
| `comunidade` | Adesão à comunidade com nível gratuito | `ControladorComunidade` |
| `perguntas` | Perguntas à equipa, com limite por utilizador | `ControladorPerguntas` |
| `chamadas` | Consulta de serviços e horários sem activar pagamentos | `ControladorChamadas` |
| `comum` | Respostas de erro com estrutura consistente | `TratadorErros` |

**Controlador:** recebe o pedido HTTP. **Serviço:** executa regras de negócio. **Adaptador:** comunica com um fornecedor externo ou com a base de dados. **DTO/record:** define os dados enviados ao cliente.

## 3. Exemplo de fluxo — consultar Mr. Bow

1. A app chama `GET /api/v1/artista`.
2. `ControladorArtista` chama `ServicoArtistas`.
3. `ServicoArtistas` fixa o código `mr-bow` e o estado `active`.
4. `ClienteSupabase` faz a consulta ao PostgREST com a chave anon.
5. O PostgreSQL aplica as políticas RLS do esquema `mrbowapp`.
6. O Java converte os campos internos em resposta pública com nomes portugueses.

Formato de resposta (valores ilustrativos, não uma consulta real):

```json
{
  "identificador": "00000000-0000-0000-0000-000000000000",
  "codigo": "mr-bow",
  "nome": "Mr. Bow",
  "descricao": null,
  "fotografia": null,
  "capa": null,
  "corDestaque": "#F1AC42",
  "verificado": false
}
```

## 4. Rotas REST, em português

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/v1/artista` | Público |
| GET | `/api/v1/publicacoes` | Público |
| GET | `/api/v1/eventos` | Público |
| POST | `/api/v1/contas/registar` | Público |
| POST | `/api/v1/contas/entrar` | Público |
| POST | `/api/v1/contas/renovar` | Público |
| POST | `/api/v1/contas/recuperar` | Público |
| POST | `/api/v1/contas/sair` | Token Bearer |
| GET/PATCH | `/api/v1/perfil` | Token Bearer |
| GET/POST | `/api/v1/comunidade/adesao` | Token Bearer |
| GET/POST | `/api/v1/perguntas` | Token Bearer |
| GET | `/api/v1/chamadas/servicos` | Público |
| GET | `/api/v1/chamadas/horarios?servico=UUID` | Público |
| GET | `/api/v1/chamadas/minhas-reservas` | Token Bearer |
| GET | `/actuator/health` | Público |
| GET | `/swagger-ui.html` | Documentação OpenAPI |

## 5. Segurança da API

- A app envia o **token Bearer** do utilizador, nunca o identificador de outro fã.
- `FiltroAutenticacao` verifica o token no serviço `/auth/v1/user` do Supabase.
- A API obtém o identificador real do utilizador a partir dessa verificação.
- As consultas privadas enviam o mesmo token ao PostgREST. As **RLS** existentes limitam o acesso a dados próprios.
- A API não recebe do fã o nível VIP, os pontos, o preço ou o estado de pagamento.
- Nenhuma chave `service_role` é incluída na aplicação móvel nem no backend actual.

A autenticação e as políticas têm de ser confirmadas em testes com **dois utilizadores distintos** antes de produção.

## 6. Evolução para aplicações de outros artistas

O código de módulos, tipos e controladores é reutilizável. Cada novo artista deverá ter distribuição, marca e isolamento de dados configurados e auditados. O objectivo **não é** permitir que a app de Mr. Bow mostre artistas diferentes.

## 7. Estado da implementação

O backend foi criado e está sujeito a testes Maven no GitHub Actions. A app tem um modo API activado por `EXPO_PUBLIC_API_URL`; na ausência desse endereço conserva o modo antigo, para não interromper uma distribuição publicada. O backend ainda não está instalado no Coolify nem validado contra o Supabase real.

**Fases posteriores:** painel administrativo, gestão de conteúdos por staff, pagamentos M-Pesa/e-Mola confirmados por webhooks, reservas atómicas, emissão de tokens LiveKit e notificações. Não apresentar essas funcionalidades como disponíveis.
