# Carta digital

## Datos (`web/src/data/carta.ts`)
```ts
import { z } from 'astro/zod';

/** Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011, anexo II). */
export const ALERGENOS = {
  gluten: 'Gluten', crustaceos: 'Crustáceos', huevos: 'Huevos', pescado: 'Pescado',
  cacahuetes: 'Cacahuetes', soja: 'Soja', leche: 'Leche', frutos_cascara: 'Frutos de cáscara',
  apio: 'Apio', mostaza: 'Mostaza', sesamo: 'Sésamo', sulfitos: 'Sulfitos',
  altramuces: 'Altramuces', moluscos: 'Moluscos',
} as const;

const plato = z.object({
  nombre: z.string(),
  descripcion: z.string().optional(),
  precio: z.number().positive().optional(),      // undefined → "S/M" (según mercado) si así lo indica el cliente
  precioTexto: z.string().optional(),            // "S/M", "por persona", "12 / 20" (media/ración)
  alergenos: z.array(z.enum(Object.keys(ALERGENOS) as [keyof typeof ALERGENOS])).optional(),
  etiquetas: z.array(z.enum(['vegetariano', 'vegano', 'sin-gluten', 'picante', 'temporada'])).default([]),
  foto: z.string().optional(),
});

export const carta = z.array(z.object({ categoria: z.string(), nota: z.string().optional(), platos: z.array(plato) }))
  .parse([ /* datos REALES de la carta del cliente */ ]);
```
- `alergenos` sin definir = "consultar" (no es lo mismo que una lista vacía, que significa "ninguno").
  Nunca deduzcas alérgenos por el nombre del plato: si el cliente no los da, se muestra "consulta al
  personal" y queda PENDIENTE.
- Precios con formato español (`12,50 €`) mediante `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.

## Diseño
- Se lee como una carta: categorías claras, nombre, descripción breve, precio alineado
  (`tabular-nums`), alérgenos discretos pero accesibles (texto, no solo iconos; si hay iconos,
  con nombre visible o `title` y leyenda).
- En móvil: índice de categorías fijo o desplegable para saltar.
- Si la carta cambia a menudo, ofrece al cliente un documento sencillo para enviarnos cambios
  (o presupuesto de panel editable).
- Página propia `/carta` (buena para SEO: "carta restaurante <lugar>") + extracto en portada.
