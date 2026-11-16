/**
 * Tokens: Keychain no iOS, Android Keystore no Android.
 * Na pre-visualização Web, apenas o armazenamento da sessão do navegador.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const chave = 'mrbow-sessao-api-v1';

export async function guardarSessao(valor: string) {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(chave, valor);
    return;
  }
  await SecureStore.setItemAsync(chave, valor);
}
export async function lerSessao(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(chave) : null;
  }
  return SecureStore.getItemAsync(chave);
}
export async function eliminarSessao() {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(chave);
    return;
  }
  await SecureStore.deleteItemAsync(chave);
}
