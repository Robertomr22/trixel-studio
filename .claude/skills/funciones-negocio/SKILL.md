---
name: funciones-negocio
description: Define el alcance e implementa funcionalidades de negocio en una web de cliente (reservas de mesa o de alojamiento, calendarios iCal, carta digital, formularios, citas, WhatsApp, mapas, eventos, catálogos, pagos, blog, idiomas). Úsala al decidir qué nivel de una función necesita el cliente y al integrarla, incluido el módulo de reservas del kit.
argument-hint: "[slug] [funcionalidad]"
---

# Funcionalidades de negocio

## Regla de oro
Una función existe de verdad o no existe. Nada de formularios que no envían, disponibilidad
inventada o integraciones simuladas. Si una parte necesita credenciales o un servicio que aún no hay,
se implementa todo lo demás, se prueba en local con dobles controlados y se documenta exactamente
qué falta configurar.

## Antes de construir cualquier función compleja
Escribe en PROYECTO.md › Funcionalidades: **alcance** acordado, **dependencias** (servidor, BD,
correo, servicios externos), **riesgos**, **coste de mantenimiento** y **coste económico** si hay
servicios de pago. Si existe una solución externa fiable que reduce mucho la complejidad, compárala
(coste, datos, dependencia) y recomienda una.

## Catálogo

| Función | Niveles de alcance | Implementación |
|---|---|---|
| **Reservas de mesa** | 1) Botón llamar/WhatsApp · 2) Solicitud + confirmación con aforo real (**módulo `reservas`**) · 3) Confirmación automática con mesas · 4) Plataforma externa (TheFork, CoverManager) | Nivel 2: [reservas.md](reservas.md). Nivel 3: ampliar el módulo (alcance grande, presupuesto aparte). Nivel 4: enlace o widget oficial + aviso de cookies si las pone |
| **Reservas de alojamiento** (casas rurales, apartamentos) | 1) Escaparate + enlace a Booking/Airbnb · 2) Solicitud directa con calendario sincronizado por iCal y confirmación manual (**módulo `alojamiento`**, pendiente de construir) · 3) Reserva y pago online | [alojamiento.md](alojamiento.md) |
| **Carta digital** | Estática (datos en `src/data/carta.ts`) · editable por el cliente | [carta.md](carta.md). Editable: empezar por archivo de datos + entrega de cambios; panel solo si los cambios son frecuentes |
| **Formulario de contacto / presupuesto** | Enlace mailto/WhatsApp · formulario con envío por servidor (necesita Node + SMTP) · servicio externo (Formspree, Web3Forms: datos fuera, revisar RGPD) | Con servidor: endpoint como el de reservas (zod, trampa, token, límite, SMTP). Registrar tratamiento en `legal.*.ts` |
| **WhatsApp** | Enlace `https://wa.me/<número>?text=` | Botón visible en móvil, sin widgets de terceros ni scripts |
| **Mapa y cómo llegar** | Enlace a mapas · mapa bajo demanda | `MapaBajoDemanda.astro` (sin cookies hasta que se pulsa) |
| **Horarios** | Tabla desde `negocio.json` | Componente propio; mismos datos alimentan JSON-LD |
| **Opiniones** | Enlace a Google/TripAdvisor · reseñas reales copiadas con permiso y fuente | Nunca inventadas ni marcadas con estrellas en datos estructurados propios |
| **Eventos / grupos** | Texto + contacto · formulario de solicitud de grupo | Formulario de servidor con campos específicos |
| **Citas (clínicas, estética)** | Llamada/WhatsApp · agenda externa (Calendly, Doctoralia) · módulo propio (pendiente de construir) | Externo: enlace o incrustación con aviso de cookies |
| **Catálogo / buscador / filtros** | Estático con filtros en cliente · con BD y panel | Datos tipados; filtros con URL compartible |
| **Pagos** | Enlace de pago (Stripe Payment Links) · checkout (Stripe/Redsys) · tienda completa | Nunca datos de tarjeta en nuestro servidor. Costes de comisión explicados antes |
| **Tienda online** | Pocas referencias: Stripe + páginas propias · catálogo grande: Shopify/WooCommerce | Recomendar con costes; desarrollo propio solo si está justificado |
| **Blog / noticias** | Content collections de Astro (Markdown en repo) · CMS headless | Si el cliente publicará solo, valorar CMS (Decap, Keystatic) y su mantenimiento |
| **Varios idiomas** | i18n de Astro con rutas `/en/` | Textos traducidos por persona o revisados; `hreflang` |

## Servicios de pago
No elijas ni contrates ninguno sin informar a Roberto del coste, la alternativa gratuita y qué datos
se comparten. Las credenciales se piden cuando hacen falta y van en `.env` del servidor.

## Integración visual
Las funciones se adaptan a la dirección de arte del proyecto (variables y clases del componente),
nunca al revés. Estados de carga, error, vacío y éxito diseñados y probados.
