/**
 * INTERNO: Usuarios de la UMSA (autenticación con SIA)
 * EXTERNO: Usuarios externos que se registran en el sistema
 */
export type TipoUsuario = 'INTERNO' | 'EXTERNO';

/**
 * - ADMINISTRADOR: Acceso total al sistema
 * - COORDINADOR: Gestión de cursos de su carrera
 * - DOCENTE: Registro de calificaciones y confirmación
 * - PARTICIPANTE: Inscripción y descarga de certificados
 * - AUXILIAR: Solo registro de asistencia en eventos asignados
 * - DISENADOR: Solo gestión de plantillas (ROL FIJO)
 */
export type Rol = 
  | 'ADMINISTRADOR' 
  | 'COORDINADOR' 
  | 'DOCENTE' 
  | 'PARTICIPANTE' 
  | 'AUXILIAR' 
  | 'DISENADOR';

/**
 * CURSO: Curso complementario con calificaciones
 * EVENTO: Evento facultativo con asistencia
 */
export type TipoActividad = 'CURSO' | 'EVENTO';

export type Modalidad = 'PRESENCIAL' | 'VIRTUAL' | 'MIXTO';

export type EstadoActividad = 'ABIERTO' | 'LLENO' | 'FINALIZADO';

export type UnidadDuracion = 'días' | 'semanas' | 'meses';

export type EstadoInscripcion = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';

export interface Usuario {
  id_usuario: number;
  username: string; // RU para UMSA, username para externos
  nombres: string;
  apellidos: string;
  email: string;
  tipo_usuario: TipoUsuario;
  email_verificado: boolean;
  estado: 'ACTIVO' | 'INACTIVO';
  roles: Rol[]; // Un usuario puede tener múltiples roles (excepto DISENADOR)
  fecha_registro: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  password_confirmacion: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface Carrera {
  id_carrera: number;
  nombre: string;
  descripcion?: string;
  estado: 'ACTIVA' | 'INACTIVA';
}

/**
 * Esta es la información que se mostrará en el catálogo público
 */
export interface Actividad {
  id_actividad: number;
  tipo: TipoActividad;
  nombre: string;
  descripcion: string;
  carga_horaria: number;
  duracion?: number | null;
  unidad?: UnidadDuracion | null;
  modalidad: Modalidad;
  fecha_inicio: string; // Formato ISO: "2024-01-15"
  fecha_fin: string;
  cupo_maximo: number;
  cupos_disponibles: number; // Calculado: cupo_maximo - inscritos
  
  costo_externo: number;
  costo_umsa: number;
  es_gratuito: boolean;
  
  nota_minima_aprobacion?: number; // Solo para cursos
  estado: EstadoActividad;
  carrera?: Carrera;
  
  imagen?: string; // URL de la imagen (por defecto si no está disponible)
  lugar?: string | null;
  
  fecha_creacion: string;
}

export interface PrecioActividad {
  actividad_id: number;
  precio_a_pagar: number; // El precio que le corresponde al usuario actual
  tipo_precio: 'EXTERNO' | 'UMSA';
  es_gratuito: boolean;
}

export interface Inscripcion {
  id_inscripcion: number;
  usuario: Usuario;
  actividad: Actividad;
  tipo_precio: 'EXTERNO' | 'UMSA';
  monto_pagado: number;
  fecha_inscripcion: string;
  estado: EstadoInscripcion;
}

export interface FiltrosActividad {
  tipo?: TipoActividad;
  modalidad?: Modalidad;
  carrera_id?: number;
  busqueda?: string;
  solo_gratuitos?: boolean;
  solo_disponibles?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Usuario | null;
  token: string | null;
  currentRole: Rol | null;
}

export interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // milisegundos
}