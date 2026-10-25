import datos from './negocio.json';
import { camposPendientes, negocioSchema } from './negocio.schema';

/** Datos validados del negocio. Si el JSON no cumple el esquema, el build falla con el motivo. */
export const negocio = negocioSchema.parse(datos);

/** Campos aún sin dato real. La web final no se entrega mientras esta lista no esté vacía. */
export const pendientes = camposPendientes(negocio);
