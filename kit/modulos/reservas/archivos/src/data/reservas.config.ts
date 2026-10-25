/**
 * Configuración de reservas de ESTE restaurante. Todos los valores deben venir del cliente:
 * horarios, aforo por servicio, tamaño máximo de grupo online, antelación y cierres.
 *
 * Mientras `configurado` sea false, la API de reservas responde 503 y la entrega se bloquea.
 */
import type { ConfigReservas } from '../lib/reservas/tipos';

export const configReservas: ConfigReservas = {
  configurado: false,
  zonaHoraria: 'Europe/Madrid',
  servicios: [
    {
      id: 'comida',
      nombre: 'Comida',
      dias: ['martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      primeraLlegada: '13:00',
      ultimaLlegada: '15:30',
      intervaloMinutos: 30,
      aforo: 40,
    },
    {
      id: 'cena',
      nombre: 'Cena',
      dias: ['jueves', 'viernes', 'sabado'],
      primeraLlegada: '20:00',
      ultimaLlegada: '22:30',
      intervaloMinutos: 30,
      aforo: 40,
    },
  ],
  personas: { min: 1, maxOnline: 8 },
  antelacion: { minMinutos: 120, maxDias: 60 },
  cierres: [],
  textoGrupos: 'Para grupos más grandes, llámanos y lo organizamos contigo.',
  conservacionDias: 90,
};
