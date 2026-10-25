# Imágenes

## Flujo
1. Original en `recursos/fotos/` (no se toca).
2. Copia de trabajo en `web/src/assets/fotos/<nombre-descriptivo>.jpg`. Si hace falta recortar o
   enderezar, hazlo con `sharp` en un script de un solo uso, nunca a mano sobre el original.
3. En la página:
```astro
---
import { Picture } from 'astro:assets';
import arroz from '../assets/fotos/arroz-negro.jpg';
---
<Picture src={arroz} formats={['avif', 'webp']} widths={[480, 800, 1200, 1800]}
  sizes="(min-width: 1100px) 50vw, 100vw" alt="Arroz negro con alioli en paellera de hierro" />
```
   La imagen principal (LCP) con `priority`; el resto con carga diferida (por defecto).

## Calidad
- No bajes la calidad por debajo de ~75 en AVIF/WebP para fotografía protagonista.
- Recortes pensados para cada formato (`object-position` o versiones distintas para móvil/escritorio
  con `<picture>` y `media`), no el mismo encuadre forzado.
- Nunca deformes (`object-fit: cover` con contenedor de proporción fija).

## Textos alternativos
- Describen lo que aporta la imagen en ese contexto ("Comedor con vigas de madera y vistas al mar"),
  no "imagen de restaurante". Decorativas: `alt=""`.

## Provisionales y licencias
- Imágenes que no son del cliente: nombre `provisional-*.jpg`, origen y licencia en
  `recursos/LEEME.md`, listadas en PROYECTO.md como pendientes de sustituir.
- No uses imágenes de Internet sin licencia clara para uso comercial.
- No generes imágenes con IA que simulen el local, los platos o el equipo del negocio.
