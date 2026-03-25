import { nanoid } from "nanoid";

export function generarCodigo(): string {
  // Genera un código legible de 8 caracteres en mayúsculas
  const id = nanoid(8).toUpperCase();
  // Formato: XXXX-XXXX
  return `${id.slice(0, 4)}-${id.slice(4)}`;
}
