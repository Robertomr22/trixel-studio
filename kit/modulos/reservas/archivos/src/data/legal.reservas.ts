/** Aporte del módulo de reservas a las páginas legales (se suma solo en src/data/legal.ts). */
import type { Cookie, Tratamiento } from './legal';
import { configReservas } from './reservas.config';

export const tratamientos: Tratamiento[] = [
  {
    actividad: 'Reserva de mesa',
    datos: ['nombre', 'email', 'teléfono', 'fecha y hora', 'número de personas', 'comentarios'],
    finalidad: 'Gestionar tu reserva y comunicarnos contigo sobre ella',
    baseJuridica: 'Aplicación de medidas precontractuales a petición del interesado (art. 6.1.b RGPD)',
    conservacion: `Se anonimizan ${configReservas.conservacionDias} días después de la fecha de la reserva`,
    encargados: ['proveedor de alojamiento web', 'proveedor de correo electrónico'],
  },
];

export const cookies: Cookie[] = [
  {
    nombre: 'trixel_admin',
    proveedor: 'Propia',
    finalidad: 'Mantener la sesión del personal en el panel de reservas (no afecta a los visitantes)',
    duracion: '8 horas',
    tipo: 'técnica',
  },
];
