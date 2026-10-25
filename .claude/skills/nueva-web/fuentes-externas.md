# Aprovechar contenido que el cliente ya tiene publicado (Booking, Airbnb, Google, web antigua)

Es la forma más rápida de arrancar, pero con reglas: lo publicado en esas plataformas mezcla
contenido **del cliente** (sus fotos, sus descripciones, sus datos) con contenido **de la plataforma
o de terceros** (reseñas de huéspedes, puntuaciones, textos generados por la plataforma).

## Qué se puede usar
| Contenido | ¿Se usa? | Cómo |
|---|---|---|
| Fotos que subió el propietario (las hizo él o tiene derechos) | Sí, con su confirmación | Mejor los **originales** (más resolución y sin compresión). Si solo existen en la plataforma, el cliente las descarga desde su extranet o su ficha y nos las pasa. Anotar en `recursos/LEEME.md` origen y que el cliente confirma los derechos |
| Descripción, servicios, equipamiento, capacidad, normas, horarios de entrada/salida | Sí, como **datos de partida** | Copiar a `brief.md`/`src/data/`, verificar con el cliente (las fichas suelen estar desactualizadas) y reescribir los textos con voz propia (no duplicar el texto de la plataforma: peor para SEO) |
| Dirección, ubicación, distancias | Sí, verificadas | Coordenadas reales para el mapa |
| Reseñas de huéspedes | **No** copiarlas en la web | Son textos de terceros sujetos a las condiciones de la plataforma. Alternativas: enlace "Opiniones en Booking", insignias oficiales si la plataforma las ofrece, o reseñas pedidas directamente a huéspedes con permiso |
| Puntuación (p. ej. 9,4) | Solo citada con fuente y enlace, verificada en la fecha | Nunca en datos estructurados propios (`aggregateRating`) |
| Precios | Solo si el cliente quiere mostrarlos | Como orientativos ("desde"), con fecha de revisión |

## Cómo extraerlo
1. Pide al cliente los **enlaces** de sus fichas.
2. Lee las fichas con WebFetch (si la plataforma lo permite) para sacar texto y datos; si se bloquea,
   pide al cliente capturas o que copie la descripción. **No uses scraping masivo** ni descargas
   automáticas que incumplan las condiciones de la plataforma.
3. Las imágenes no se pueden descargar desde aquí: pide la carpeta de fotos (o que el cliente las
   guarde en una carpeta de su PC conectada a la sesión).
4. Todo lo extraído entra como **pendiente de verificar** hasta que el cliente lo confirme.
