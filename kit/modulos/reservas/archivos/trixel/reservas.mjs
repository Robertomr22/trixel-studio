/**
 * Variables de entorno del módulo de reservas (validadas por Astro al arrancar/compilar).
 * @param {typeof import('astro/config').envField} envField
 */
export function entorno(envField) {
  const secreto = (opciones = {}) => envField.string({ context: 'server', access: 'secret', ...opciones });
  return {
    DATABASE_URL: secreto(),
    SESION_SECRETO: secreto({ min: 32 }),
    ADMIN_USUARIO: secreto(),
    ADMIN_HASH: secreto({ startsWith: 'scrypt:' }),
    EMAIL_AVISOS: secreto(),
    EMAIL_REMITENTE: secreto(),
    SMTP_HOST: secreto({ optional: true }),
    SMTP_PUERTO: envField.number({ context: 'server', access: 'secret', default: 465 }),
    SMTP_USUARIO: secreto({ optional: true }),
    SMTP_CLAVE: secreto({ optional: true }),
    URL_PUBLICA: envField.string({ context: 'server', access: 'public', optional: true }),
  };
}
