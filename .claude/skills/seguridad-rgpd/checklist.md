# Lista de seguridad

## Entrada de datos
- [ ] Toda ruta de servidor valida el cuerpo y los parámetros con zod (tipos, longitudes, formatos).
- [ ] Rechazo de caracteres de control en textos que acaban en correos o en el panel.
- [ ] Consultas a BD solo con Drizzle o consultas parametrizadas; nunca SQL concatenado.
- [ ] Salida escapada: en Astro `{valor}` escapa; `set:html` solo con contenido propio de confianza.
- [ ] Endpoints que cambian datos aceptan solo `POST` y JSON, o formularios en páginas con
      `checkOrigin` de Astro (activo por defecto en rutas de servidor).

## Autenticación y sesiones
- [ ] Contraseñas con scrypt (`lib/seguridad/clave.ts`), nunca en claro ni en el repo.
- [ ] Cookie de sesión firmada, `HttpOnly`, `Secure` en HTTPS, `SameSite=Strict`, caducidad.
- [ ] Límite de intentos de login por IP.
- [ ] Todas las rutas privadas protegidas en el middleware (prueba sin sesión → redirección).
- [ ] Mensajes de login que no revelan si falla el usuario o la contraseña.

## Abuso
- [ ] Formularios públicos: campo trampa + token con tiempo mínimo + límite por IP.
- [ ] Límites de tamaño en textos y en el cuerpo de las peticiones.
- [ ] Operaciones con concurrencia (aforo, stock) atómicas y probadas.

## Secretos y entornos
- [ ] Secretos solo en `.env` (local) o en el panel del hosting (producción). `.env` en `.gitignore`.
- [ ] `.env.example` sin valores reales.
- [ ] Secretos distintos por proyecto y por entorno; `SESION_SECRETO` aleatorio de ≥ 32 caracteres.
- [ ] Ningún secreto en variables públicas ni en el JavaScript del navegador (busca en `dist/client`).
- [ ] BD de producción con usuario propio y permisos solo sobre su base de datos.

## Respuestas y cabeceras
- [ ] Errores: mensaje genérico al usuario, detalle al registro (sin datos personales innecesarios).
- [ ] Rutas de servidor: `X-Content-Type-Options`, `Referrer-Policy`, `Cache-Control: no-store` en
      privadas, `X-Frame-Options: DENY` en el panel (middleware del módulo).
- [ ] Hosting: HTTPS forzado y HSTS activados en el panel del hosting o `.htaccess`.
- [ ] `robots.txt` excluye `/admin` y `/api`; páginas privadas con `noindex`.

## Dependencias
- [ ] `npm audit --omit=dev` sin vulnerabilidades altas o críticas.
- [ ] Sin dependencias abandonadas o innecesarias; versiones fijadas por `package-lock.json`.

## Datos y copias
- [ ] Solo se guardan los datos necesarios; plazo de conservación aplicado.
- [ ] Copias de seguridad de la BD activadas en el hosting (Hostinger las incluye; comprobar
      frecuencia) y procedimiento de restauración documentado en el README.
