# Publicar en Hostinger

> Comprueba la documentación actual de Hostinger antes de cada publicación: los paneles cambian.
> Fuentes: https://docs.hostinger.com/node.js/overview · https://www.hostinger.com/support/1583661-is-node-js-supported-at-hostinger/

## Qué admite cada plan (octubre 2026)
- **Business y Cloud**: aplicaciones Node.js (Astro con servidor incluido) desplegadas desde GitHub/
  GitLab o subiendo un `.zip`; se elige la versión de Node en el panel. Incluyen bases de datos MySQL
  y buzones de correo. La app se detiene tras un rato sin tráfico y arranca con la siguiente visita
  (la primera carga es más lenta).
- **Premium / Single**: alojamiento web clásico (archivos estáticos, PHP, MySQL). Sin Node: solo
  webs estáticas del kit.
- **VPS**: control total (Node con PM2, Nginx…). Más mantenimiento: solo si hace falta.

## Web estática (cualquier plan)
1. `cp .claude/skills/entrega/htaccess-estatico web/public/.htaccess` y `npm run build`.
2. hPanel › Archivos › Administrador de archivos › `public_html`: sube el **contenido** de `dist/`
   (o por FTP/SFTP).
3. Activa SSL en hPanel y fuerza HTTPS.

## Web con servidor (Business / Cloud)
1. **Base de datos**: hPanel › Bases de datos › MySQL: crear BD y usuario con contraseña fuerte.
   `DATABASE_URL=mysql://usuario:contraseña@localhost:3306/nombre_bd` (host según indique el panel).
2. **Correo**: crear buzón del dominio (p. ej. `reservas@dominio.es`). SMTP de Hostinger:
   `smtp.hostinger.com`, puerto 465 (SSL) → `SMTP_HOST`, `SMTP_PUERTO`, `SMTP_USUARIO`, `SMTP_CLAVE`,
   `EMAIL_REMITENTE` (el mismo buzón). Configura SPF/DKIM/DMARC del dominio (Hostinger los ofrece)
   para que los correos no vayan a spam.
3. **Panel**: `npm run admin:clave` en local → `ADMIN_HASH` y `SESION_SECRETO`. Elige `ADMIN_USUARIO`.
   Entrega la contraseña al cliente por un canal seguro (no por el mismo correo que el usuario).
4. **App Node**: hPanel › Websites › añadir web › Node.js. Origen: repo de GitHub del cliente (rama
   `main`) o zip del proyecto sin `node_modules`. Directorio raíz: `web`. Build: `npm ci && npm run
   build`. Archivo de entrada: `server.mjs`. Versión de Node ≥ 22.23 (requisito de Astro 7).
5. **Variables de entorno** en el panel de la app (todas las de `.env.example`), con `URL_PUBLICA`
   = dominio final con https.
6. Desplegar. Los registros de la app deben mostrar "Base de datos al día" y "Server listening".
7. Comprobar `/api/salud`, hacer una reserva de prueba, confirmarla en `/admin`, cancelarla.
8. Copias de seguridad: confirmar que están activas para archivos y BD.

## Actualizaciones
Commit en `main` → Hostinger reconstruye (si está conectado a GitHub) o subir zip nuevo. Las
migraciones de BD se aplican solas al arrancar (`server.mjs`). Antes de una migración que borre o
transforme datos: copia de seguridad de la BD.

## Otros proveedores
Cualquier hosting con Node ≥ 22.23 y MySQL/MariaDB sirve con los mismos pasos. Sin Node: solo la
versión estática; las funciones con servidor necesitarían otra arquitectura (PHP o servicio externo):
plantéalo antes de desarrollar.
