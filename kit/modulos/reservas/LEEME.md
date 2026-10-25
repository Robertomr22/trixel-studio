# Módulo de reservas

Solicitud de reserva con **disponibilidad real** y **confirmación por el restaurante**.

## Qué hace

| Parte | Detalle |
|---|---|
| Disponibilidad | Por servicio (comida, cena…), días, horas de llegada, aforo total y opcionalmente por franja. Cierres por fechas. Antelación mínima y máxima. Calculada con las reservas reales de la BD. |
| Solicitud | Formulario accesible (`FormularioReserva.astro`) → `POST /api/reservas` (JSON). Estado inicial: *pendiente*. |
| Antiabuso | Campo trampa, token firmado con tiempo mínimo de 3 s, límite de peticiones por IP, solo JSON (no se puede enviar desde formularios de otras webs). |
| Aforo atómico | Bloqueo con nombre por fecha (`GET_LOCK`): solicitudes simultáneas nunca superan el aforo (probado con 14 peticiones a la vez). |
| Duplicados | Mismo email + fecha + servicio activo → rechazada. |
| Panel `/admin` | Login (scrypt + cookie firmada HttpOnly/SameSite=Strict, 8 h), pendientes, día con ocupación, 7 días, confirmar / rechazar con mensaje / cancelar, alta manual (teléfono) con opción de forzar aforo. |
| Correos | Cliente: recibida, confirmada, rechazada, cancelada. Restaurante: nueva solicitud, cancelación. Fallos de envío quedan registrados y se ven en el panel. |
| Cancelación | Enlace con token de un solo uso (se guarda solo su hash). Requiere pulsar un botón (los antivirus de correo no cancelan solos). |
| RGPD | Consentimiento con fecha, anonimización automática a los `conservacionDias`, aporte a la política de privacidad y cookies. |
| Producción | `server.mjs`: aplica migraciones y arranca. `GET /api/salud` comprueba BD, correo y configuración. |

## Qué NO hace (alcance acordado)

- No asigna mesas concretas ni calcula rotaciones por duración: controla **comensales por servicio/franja**.
- No envía recordatorios ni SMS.
- Un solo usuario de panel por restaurante.

## Pasos en un proyecto

1. `node tools/modulo.mjs añadir reservas <slug>` y `npm install` en `web/`.
2. Base de datos local: `docker compose -f docker-compose.bd.yml up -d` (o un MySQL/MariaDB propio con las BD de `scripts/bd-inicial.sql`).
3. Rellenar `src/data/reservas.config.ts` con datos **reales** y `configurado: true`.
4. Integrar `<FormularioReserva />` en el diseño (variables `--rf-*` o clases `.rf__*`).
5. `npm run verificar` (tipos, unitarias, integración con BD real, build, navegador).

## Si cambia el esquema de la BD

`npm run db:generar -- --name descripcion` crea la migración en `drizzle/`. `server.mjs` la aplica al arrancar.
