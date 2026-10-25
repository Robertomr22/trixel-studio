/**
 * Limitador de peticiones en memoria (ventana deslizante por clave).
 * Suficiente para una única instancia Node (Hostinger Business/Cloud). Se reinicia si el
 * proceso se reinicia; es una capa más, no la única defensa (hay campo trampa y token).
 */
export class Limitador {
  private registros = new Map<string, number[]>();

  constructor(
    private readonly maximo: number,
    private readonly ventanaMs: number,
  ) {}

  /** Devuelve true si la petición está permitida y la registra. */
  permitir(clave: string, ahora = Date.now()): boolean {
    const desde = ahora - this.ventanaMs;
    const marcas = (this.registros.get(clave) ?? []).filter((t) => t > desde);
    if (marcas.length >= this.maximo) {
      this.registros.set(clave, marcas);
      return false;
    }
    marcas.push(ahora);
    this.registros.set(clave, marcas);
    if (this.registros.size > 10_000) this.limpiar(desde);
    return true;
  }

  private limpiar(desde: number) {
    for (const [clave, marcas] of this.registros) {
      if (marcas.every((t) => t <= desde)) this.registros.delete(clave);
    }
  }
}
