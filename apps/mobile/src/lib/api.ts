/**
 * Cliente HTTP da API Java, independente do Supabase e de React Native.
 * A app nunca precisa de conhecer nomes de tabelas ou políticas PostgreSQL.
 */
export const enderecoApi = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
export const apiConfigurada = /^https:\/\//.test(enderecoApi)
  || /^http:\/\/localhost(?::\d+)?$/.test(enderecoApi)
  || /^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(enderecoApi);

export class ErroApi extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    detalhe: string,
  ) {
    super(detalhe);
    this.name = 'ErroApi';
  }
}

type Opcoes = {
  metodo?: 'GET' | 'POST' | 'PATCH';
  token?: string;
  corpo?: unknown;
};

export async function pedirApi<T>(rota: string, opcoes: Opcoes = {}): Promise<T> {
  if (!apiConfigurada) throw new Error('O endereço da API Java não está configurado.');
  if (!rota.startsWith('/') || rota.startsWith('//')) throw new Error('Rota inválida.');
  const resposta = await fetch(enderecoApi + '/api/v1' + rota, {
    method: opcoes.metodo || 'GET',
    headers: {
      Accept: 'application/json',
      ...(opcoes.corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(opcoes.token ? { Authorization: 'Bearer ' + opcoes.token } : {}),
    },
    ...(opcoes.corpo === undefined ? {} : { body: JSON.stringify(opcoes.corpo) }),
  });
  const dados = await resposta.json().catch(() => ({})) as Record<string, unknown>;
  if (!resposta.ok) {
    const codigo = typeof dados.erro === 'string' ? dados.erro : 'PEDIDO_RECUSADO';
    const detalhe = typeof dados.detalhe === 'string'
      ? dados.detalhe : 'Não foi possível concluir o pedido.';
    throw new ErroApi(resposta.status, codigo, detalhe);
  }
  return dados as T;
}

export type ArtistaApi = {
  identificador: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  fotografia: string | null;
  capa: string | null;
  corDestaque: string;
  verificado: boolean;
};

export type PublicacaoApi = {
  identificador: string;
  titulo: string;
  texto: string;
  enderecoMultimedia: string | null;
  categoria: 'novidade' | 'musica' | 'bastidores';
  dataPublicacao: string;
};

export type EventoApi = {
  identificador: string;
  titulo: string;
  local: string;
  cidade: string;
  dataInicio: string;
  enderecoBilhete: string | null;
};

export type SessaoApi = {
  tokenAcesso: string;
  tokenRenovacao: string;
  expiraEm: number;
  tipo: string;
  identificadorUtilizador: string;
  correio: string;
  nome: string | null;
};
