# Reservas de alojamiento (casas rurales, apartamentos)

Distinto de las reservas de mesa: se reservan **noches** de una **unidad** (una casa entera), y el
riesgo principal es la **doble reserva** con Booking/Airbnb.

## Niveles de alcance
| Nivel | Qué hace | Necesita | Mantenimiento |
|---|---|---|---|
| 1 · Escaparate | Fichas de cada casa + botón "Reservar en Booking/Airbnb" + WhatsApp | Solo estático (cualquier hosting) | Mínimo |
| 2 · Solicitud directa con calendario sincronizado (**recomendado para empezar**) | Calendario de cada casa que lee las fechas ocupadas del iCal de Booking/Airbnb; el huésped elige fechas libres y envía una solicitud; el propietario confirma desde un panel; al confirmar, la web publica su propio iCal para que Booking bloquee esas fechas | Node + MySQL + SMTP (Hostinger Business/Cloud) | Medio |
| 3 · Reserva y pago online | Nivel 2 + precio por temporada, cálculo de total, señal o pago con Stripe, condiciones de cancelación | Lo anterior + Stripe + textos legales de contratación | Alto (presupuesto aparte) |

## Cómo funciona el nivel 2 (módulo `alojamiento`, por construir sobre la base de `reservas`)
- **Entrada**: URL iCal de exportación de cada casa en Booking (Extranet › Tarifas y disponibilidad ›
  Sincronizar calendarios) y Airbnb. Se descargan cada X minutos y al consultar (con caché).
- **Disponibilidad** = noches libres en TODOS los calendarios externos − solicitudes pendientes y
  reservas confirmadas en la web. Estancia mínima, días de entrada permitidos y antelación
  configurables por casa.
- **Salida**: `/calendario/<casa>.ics` con las reservas confirmadas en la web, para importarlo en
  Booking/Airbnb y que bloqueen esas fechas.
- **Límite honesto**: la sincronización iCal no es instantánea (Booking la refresca cada cierto tiempo),
  por eso las solicitudes web **no se confirman solas**: el propietario confirma tras comprobar.
  Así no se promete algo que el sistema no puede garantizar.
- Reutiliza del módulo de reservas: validación, antiabuso, panel, sesión, correos, cancelación por
  enlace, anonimización, migraciones y pruebas.

## Datos que no se piden en la web
DNI/pasaporte y datos del parte de viajeros se recogen a la llegada o por el canal oficial, no en el
formulario de solicitud (minimización de datos).
