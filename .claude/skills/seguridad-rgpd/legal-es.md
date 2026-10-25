# Obligaciones legales habituales de una web en España

> Base orientativa para preparar la web. No sustituye el asesoramiento jurídico del cliente.

## Aviso legal (LSSI, art. 10)
Datos del titular: nombre o razón social, NIF, domicilio, email; datos registrales si es sociedad;
colegio profesional, título y número si es una profesión regulada; autorización administrativa si
la actividad lo requiere. Lo genera `pages/legal/aviso-legal.astro` desde `negocio.json › titular`.

## Política de privacidad (RGPD arts. 13–14, LOPDGDD)
Responsable, finalidades, base jurídica, plazos de conservación, destinatarios/encargados,
transferencias internacionales (si un servicio está fuera del EEE), derechos y cómo ejercerlos,
derecho a reclamar ante la AEPD. Se genera desde `src/data/legal.ts`. Revisar transferencias si se
usan servicios de EE. UU.

## Formularios
- Información básica (primera capa) junto al formulario: responsable, finalidad, derechos y enlace a
  la política completa.
- Casilla de aceptación no premarcada. El envío de publicidad requiere una casilla **separada** y
  opcional (LSSI art. 21).

## Cookies (LSSI art. 22.2 y Guía de cookies de la AEPD)
- Cookies técnicas necesarias: exentas de consentimiento; se informa en la política.
- Analíticas, de personalización o publicitarias: consentimiento previo, informado y granular;
  rechazar tan fácil como aceptar; posibilidad de retirar el consentimiento; sin instalarlas antes.
- Incrustaciones de terceros (YouTube, Google Maps, redes) suelen poner cookies: cargarlas bajo
  demanda o con consentimiento.

## Comercio electrónico (si hay ventas)
Información previa al contrato (precio final con impuestos, gastos de envío, plazos), condiciones
generales, derecho de desistimiento de 14 días y formulario, factura, hojas de reclamaciones según
comunidad autónoma. Revisión profesional obligatoria.

## Alojamiento turístico (casas rurales, viviendas con fines turísticos)
- **Número de inscripción en el Registro de Turismo de Andalucía** de cada alojamiento: debe figurar
  en toda la publicidad, incluida la web propia. Ponerlo en la ficha de cada casa y en el pie.
- Comprobar con el cliente si sus alojamientos tienen también número del **registro único de
  arrendamientos** (Real Decreto 1312/2024) y si debe mostrarse.
- Precios mostrados: finales, con impuestos y gastos obligatorios (limpieza, tasas) o indicando
  claramente qué no incluyen.
- El parte de viajeros (registro de huéspedes) no se recoge por la web: minimización.

## Accesibilidad
La Ley 11/2023 extiende requisitos de accesibilidad a muchos servicios de comercio electrónico desde
junio de 2025 (microempresas de servicios exentas en parte). Aplicar WCAG 2.1 AA como estándar de la
casa en todas las webs.

## Qué marcar como pendiente del cliente
- Validar textos legales (o pasarlos a su asesor).
- Contratos de encargado con hosting, correo y servicios externos.
- Registro de actividades de tratamiento si le aplica.
- Consentimientos de las personas que aparecen en fotos.
