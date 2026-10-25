/**
 * Inventario de tratamientos de datos y cookies de ESTA web.
 * Las páginas legales se generan a partir de aquí, así que deben reflejar la realidad.
 *
 * - Lo propio del proyecto se añade en los arrays de abajo.
 * - Cada módulo instalado aporta su archivo src/data/legal.<modulo>.ts y se suma solo.
 *
 * Los textos resultantes son una base orientativa (RGPD, LOPDGDD, LSSI). Antes de publicar
 * una web real, el titular debe revisarlos o encargar su revisión a un profesional.
 */

export interface Tratamiento {
  /** Qué hace el usuario: "Formulario de contacto", "Reserva de mesa"… */
  actividad: string;
  datos: string[];
  finalidad: string;
  baseJuridica: string;
  conservacion: string;
  /** Proveedores que acceden a los datos (hosting, correo…). */
  encargados: string[];
}

export interface Cookie {
  nombre: string;
  proveedor: string;
  finalidad: string;
  duracion: string;
  tipo: 'técnica' | 'preferencias' | 'analítica' | 'publicidad';
}

interface AporteLegal {
  tratamientos?: Tratamiento[];
  cookies?: Cookie[];
}

const aportes = Object.values(import.meta.glob<AporteLegal>('./legal.*.ts', { eager: true }));

export const tratamientos: Tratamiento[] = [
  // Tratamientos propios del proyecto
  ...aportes.flatMap((a) => a.tratamientos ?? []),
];

export const cookies: Cookie[] = [
  // Cookies propias del proyecto
  ...aportes.flatMap((a) => a.cookies ?? []),
];

/** Cookies que no son técnicas requieren consentimiento previo (art. 22.2 LSSI). */
export const requiereConsentimientoCookies = cookies.some((c) => c.tipo !== 'técnica');
