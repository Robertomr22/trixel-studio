# Reservas (módulo `kit/modulos/reservas`)

Detalle técnico completo: `kit/modulos/reservas/LEEME.md`.

## Preguntas al cliente (con respuesta por defecto entre paréntesis)
1. Servicios y días: ¿comida y cena? ¿qué días cada uno? (los de su horario)
2. Horas de llegada que se aceptan por servicio y cada cuánto (cada 30 min).
3. Aforo de comensales por servicio que se puede reservar online (no tiene por qué ser el aforo total:
   pueden reservar mesas para gente sin reserva).
4. ¿Límite de llegadas por franja para no saturar cocina? (opcional)
5. Grupo máximo online y qué hacer con grupos mayores (8; llamar).
6. Antelación mínima y máxima (2 h; 60 días).
7. Días de cierre y vacaciones conocidos.
8. ¿Quién recibe los avisos y quién confirma? Email para avisos y usuario del panel.
9. Plazo de conservación de datos tras la reserva (90 días).

## Pasos
1. `node tools/modulo.mjs añadir reservas <slug>` → `npm install` en `web/`.
2. BD local: `docker compose -f docker-compose.bd.yml up -d` (Roberto en su PC) o MariaDB local.
   `.env` y `.env.test` se generan solos con valores locales; la contraseña local del panel está en
   el comentario final de `.env`.
3. `npm run db:migrar` (BD de desarrollo).
4. Rellena `src/data/reservas.config.ts` con los datos REALES y `configurado: true`.
5. Integra `<FormularioReserva />` en el diseño: en la página o sección que marque la propuesta
   aprobada, con sus variables `--rf-*` (acento, líneas, radio, fondo de campo) y, si hace falta,
   estilos para `.rf__*` desde el proyecto. Comprueba los estados: sin fecha, cargando, sin horas,
   cerrado, grupo grande, error, éxito.
6. `npm run verificar`: unitarias, integración contra BD real (incluye concurrencia de aforo) y flujo
   completo en navegador (solicitud → correos → panel → confirmación → cancelación).
7. Rellena en PROYECTO.md: alcance, configuración y qué falta en producción (BD, SMTP, credenciales).

## En producción (ver skill `entrega`)
Plan con Node (Hostinger Business o Cloud), BD MySQL, buzón SMTP del dominio, variables de entorno,
`server.mjs` como archivo de entrada, comprobar `/api/salud` y hacer una reserva real de prueba.

## Ampliaciones posibles (presupuestar aparte)
Asignación de mesas, duración y rotación, recordatorio por email el día antes, varios usuarios de
panel, exportar a CSV, lista de espera, depósito con Stripe.
