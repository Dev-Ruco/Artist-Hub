package mz.mrbow.plataforma.seguranca;

import java.util.UUID;

/** Identidade validada remotamente pelo Supabase Auth, nunca pelo cliente. */
public record FaAutenticado(UUID identificador, String correio, String token) {}
