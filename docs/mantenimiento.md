# Mantenimiento del sistema

## Mejorar el kit
- Cambios técnicos reutilizables → `kit/base` o `kit/modulos/<modulo>/archivos`.
- Después de tocar el kit: crea un proyecto de prueba y ejecuta todo:
  ```bash
  node tools/nuevo-proyecto.mjs prueba-kit --nombre "Prueba" --instalar
  node tools/modulo.mjs añadir reservas prueba-kit   # si afecta al módulo
  cd clientes/prueba-kit/web && npm install && npm run verificar
  ```
  Borra `clientes/prueba-kit` al terminar.
- Los proyectos existentes **no** se actualizan solos: aplica el cambio a mano en los que lo
  necesiten y pasa sus pruebas.

## Nuevo módulo funcional
```
kit/modulos/<nombre>/
├── modulo.json      dependencias, scripts, variables de entorno, notas, archivos protegidos
├── LEEME.md         qué hace, qué no, pasos
└── archivos/        se copian dentro de web/ (src/…, tests/…, trixel/<nombre>.mjs)
```
Debe traer pruebas (unitarias, integración si hay BD, e2e) y su aporte legal (`src/data/legal.<nombre>.ts`).

## Actualizar dependencias del kit
1. `npm outdated` en un proyecto de prueba; actualizar versiones en `kit/base/package.json` y
   `modulo.json`.
2. Playwright: subir `@playwright/test` y `playwright-core` juntos y `npx playwright install chromium`.
3. `npm run verificar` completo en el proyecto de prueba.
4. Commit en el repo del estudio con lo que cambió.

## Skills
- Reglas comunes → `CLAUDE.md` (corto, siempre cargado).
- Procedimientos → skills (se cargan cuando hacen falta). Una skill no repite lo de otra: la enlaza.
- Cuando algo salga mal en un proyecto real, añade la lección a la skill correspondiente (p. ej. un
  anti-patrón nuevo, una pregunta que faltó en el descubrimiento).
