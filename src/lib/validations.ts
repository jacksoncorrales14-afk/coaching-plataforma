import { z } from "zod";
import { NextResponse } from "next/server";

// --- Parse helper ---
export function parseBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): { data: T; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: "Datos invalidos",
          details: result.error.issues.map(
            (issue) =>
              `${issue.path.map(String).join(".")}: ${issue.message}`
          ),
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}

// --- Shared primitives ---
const email = z
  .string()
  .email("Email invalido")
  .transform((v) => v.trim().toLowerCase());
const nonEmpty = z.string().min(1, "Campo requerido");

// --- Clases ---
export const createClaseSchema = z.object({
  titulo: nonEmpty,
  descripcion: nonEmpty,
  contenido: z.string().optional().default(""),
  imagen: z.string().optional().default(""),
  imagenPos: z.string().optional().default("50% 50%"),
  precio: z.number().min(0).optional().default(0),
  categoria: z.string().optional().default("General"),
  publicada: z.boolean().optional().default(false),
  orden: z.number().int().min(0).optional().default(0),
});

export const updateClaseSchema = z.object({
  titulo: z.string().optional(),
  descripcion: z.string().optional(),
  contenido: z.string().optional(),
  imagen: z.string().optional(),
  imagenPos: z.string().optional(),
  precio: z.number().min(0).optional(),
  categoria: z.string().optional(),
  publicada: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});

// --- Codigos ---
export const generarCodigosSchema = z.object({
  claseId: nonEmpty,
  cantidad: z.number().int().min(1).max(50).optional().default(1),
});

// --- Desbloquear ---
export const desbloquearSchema = z.object({
  codigo: nonEmpty,
  email: email,
  nombre: nonEmpty,
});

// --- Membresia ---
export const crearMembresiaSchema = z.object({
  email: email,
  nombre: nonEmpty,
  plan: z.enum(["mensual", "trimestral"], {
    message: "Plan debe ser 'mensual' o 'trimestral'",
  }),
});

// --- Admin membresia actions ---
export const adminMembresiaSchema = z.object({
  id: nonEmpty,
  accion: z.enum(["cancelar", "reactivar"], {
    message: "Accion debe ser 'cancelar' o 'reactivar'",
  }),
});

// --- Programas ---
const videoInput = z.object({
  titulo: z.string().optional().default(""),
  url: z.string().optional().default(""),
  duracion: z.number().int().min(0).optional().default(0),
});

const nivelInput = z.object({
  titulo: z.string().optional().default(""),
  descripcion: z.string().optional().default(""),
  videos: z.array(videoInput).optional().default([]),
});

export const createProgramaSchema = z.object({
  titulo: nonEmpty,
  descripcion: z.string().optional().default(""),
  imagen: z.string().optional().default(""),
  imagenPos: z.string().optional().default("50% 50%"),
  niveles: z.array(nivelInput).optional().default([]),
});

export const updateProgramaSchema = z.object({
  id: nonEmpty,
  titulo: z.string().optional(),
  descripcion: z.string().optional(),
  imagen: z.string().optional(),
  imagenPos: z.string().optional(),
  precio: z.number().min(0).optional(),
  publicado: z.boolean().optional(),
});

export const deleteByIdSchema = z.object({
  id: nonEmpty,
});

// --- Niveles ---
export const createNivelSchema = z.object({
  programaId: nonEmpty,
  titulo: nonEmpty,
  descripcion: z.string().optional().default(""),
});

// --- Videos ---
export const createVideoSchema = z.object({
  nivelId: nonEmpty,
  titulo: nonEmpty,
  url: z.string().optional().default(""),
  duracion: z.number().int().min(0).optional().default(0),
});

// --- Admin Tareas ---
export const createTareaSchema = z.object({
  videoId: nonEmpty,
  titulo: nonEmpty,
  descripcion: z.string().optional().default(""),
});

// --- Student tareas toggle ---
export const toggleTareaSchema = z.object({
  email: email,
  tareaId: nonEmpty,
  nota: z.string().optional().default(""),
});

// --- Progreso ---
export const progresoSchema = z.object({
  email: email,
  videoId: nonEmpty,
  progreso: z.number().min(0).max(100).optional().default(100),
  visto: z.boolean().optional().default(true),
});

// --- Comunidad ---
export const comentarioSchema = z.object({
  email: email,
  nombre: nonEmpty,
  avatar: z.string().optional().default(""),
  contenido: nonEmpty,
  tipo: z.enum(["curso", "programa", "comunidad"]).optional().default("comunidad"),
  refId: z.string().optional().default("general"),
  parentId: z.string().nullable().optional().default(null),
});

// --- Reacciones ---
export const reaccionSchema = z.object({
  email: email,
  comentarioId: nonEmpty,
  tipo: z
    .enum(["corazon", "aplauso", "fuego"])
    .optional()
    .default("corazon"),
});

// --- Perfil ---
export const updatePerfilSchema = z.object({
  email: email,
  nombre: z.string().optional().default(""),
  bio: z.string().optional().default(""),
});

// --- Verificar codigo ---
export const verificarCodigoSchema = z.object({
  email: email,
  codigo: nonEmpty,
});

// --- Recuperar password ---
export const recuperarPasswordSchema = z.object({
  email: email,
});

// --- Recuperar codigo ---
export const recuperarCodigoSchema = z.object({
  email: email,
});

// --- Videollamada ---
export const crearVideollamadaSchema = z.object({
  email: email,
  nombre: nonEmpty,
  mensaje: z.string().optional().default(""),
});

export const proponerFechaSchema = z.object({
  fechaPropuesta: z.string().min(1, "Fecha requerida"),
  mensaje: z.string().optional().default(""),
});

export const adminVideollamadaSchema = z.object({
  id: nonEmpty,
  accion: z.enum(["marcar_pagada", "confirmar", "completar", "cancelar"]),
  fechaConfirmada: z.string().optional(),
  enlace: z.string().optional(),
  notasAdmin: z.string().optional(),
});

export const configPlataformaSchema = z.object({
  precioVideollamada: z.number().min(0).optional(),
  videollamadaActiva: z.boolean().optional(),
});
