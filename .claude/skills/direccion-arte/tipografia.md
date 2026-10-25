# Tipografía

Todas estas familias están en npm como `@fontsource-variable/<nombre>` (variable, preferible) o
`@fontsource/<nombre>` (pesos sueltos), con soporte para español. Se instalan en el proyecto y se
sirven desde nuestro dominio (rápido y sin enviar datos a Google: mejor para el RGPD).

```bash
npm install @fontsource-variable/newsreader
```
```astro
---
import '@fontsource-variable/newsreader';            // en el layout del proyecto
---
<style is:global>:root { --fuente-texto: 'Newsreader Variable', Georgia, serif; }</style>
```
Para pesos sueltos: `import '@fontsource/young-serif/400.css'`. Carga solo los pesos y estilos
que se usan. Añade `font-display: swap` (fontsource ya lo trae) y define fallbacks del mismo género.

## Catálogo orientativo (evita las de uso masivo; justifica cualquier otra)

### Serif
| Familia | Paquete | Carácter | Bien para |
|---|---|---|---|
| Newsreader | variable | Editorial, legible, con óptico | Texto largo, gastronomía, editorial |
| Fraunces | variable | Expresiva, "soft", con ejes WONK/SOFT | Titulares con calidez; cuidado: muy vista en IA, usarla con tratamiento propio |
| Literata | variable | Libro, sobria | Despachos, editorial, clásico |
| Source Serif 4 | variable | Neutra, robusta | Corporativo clásico, texto |
| EB Garamond | variable | Clásica, renacentista | Clásico y elegante, vino, tradición |
| Cormorant Garamond | variable | Display fina, alto contraste | Premium (solo tamaños grandes) |
| Bodoni Moda | variable | Moda, contraste extremo | Premium, lujo (solo display) |
| Crimson Pro | variable | Libro, compacta | Texto clásico |
| Petrona | variable | Contemporánea, amplia | Editorial moderna |
| Brygada 1918 | variable | Histórica, con personalidad | Oficios con historia |
| Besley | variable | Clarendon, robusta, cálida | Tradición popular, bares, mercados |
| Hedvig Letters Serif | variable | Contemporánea con rasgos | Marcas con personalidad |
| Young Serif | estática 400 | Display cálida, gruesa | Titulares artesanos |
| Gloock | estática 400 | Display de alto contraste | Premium con carácter |
| Instrument Serif | estática 400/italic | Condensada elegante | Display editorial; muy vista, tratar con cuidado |
| Libre Caslon Text | estática | Imprenta clásica | Clásico |
| Spectral | estática | Pantalla, fina | Texto editorial |

### Sans
| Familia | Paquete | Carácter | Bien para |
|---|---|---|---|
| Schibsted Grotesk | variable | Grotesca de prensa, firme | Editorial, comercial |
| Hanken Grotesk | variable | Neutra cálida | Texto de interfaz |
| Familjen Grotesk | variable | Grotesca con rasgos | Moderno con personalidad |
| Instrument Sans | variable | Contemporánea, con ancho variable | Moderno, estudios |
| Public Sans | variable | Institucional, clara | Corporativo, servicios públicos |
| Work Sans | variable | Grotesca amplia | Comercial, titulares |
| Albert Sans | variable | Geométrica nórdica | Minimalista |
| Onest | variable | Neutra, muy legible | Texto de interfaz |
| Archivo | variable | Grotesca con anchos (condensada a expandida) | Industrial, talleres, deporte |
| Bricolage Grotesque | variable | Expresiva, con óptico | Creativo, marcas jóvenes |
| Commissioner | variable | Humanista con ejes | Natural, servicios |
| Epilogue | variable | Geométrica con carácter | Creativo, moderno |
| Manrope | variable | Moderna redondeada | Tecnología (muy vista) |
| Jost | variable | Geométrica tipo Futura | Moderno clásico, arquitectura |
| Big Shoulders Display | variable | Condensada industrial | Titulares de impacto |
| Anybody | variable | Ancho variable extremo | Experimental |
| Syne / Unbounded | variable | Muy expresivas | Experimental, solo display |

## Reglas
- Una familia, o dos claramente distintas. Nunca tres sin motivo.
- Cuerpo de texto ≥ 17 px en móvil, interlineado 1,5–1,7 (serif algo más que sans).
- Línea de lectura ≤ 75 caracteres.
- Escala con `clamp()` y una proporción definida (p. ej. 1,25 en móvil → 1,333 en escritorio).
- Titulares grandes: ajusta tracking negativo y `text-wrap: balance`.
- Cifras en tablas, horarios y precios: `font-variant-numeric: tabular-nums`.
- Comprueba acentos, ñ, ¿¡ y comillas « » en la fuente elegida a tamaño real.
