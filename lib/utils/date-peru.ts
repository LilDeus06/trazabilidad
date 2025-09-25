/**
 * Utilidades para manejo de fechas y horas en zona horaria de Perú
 * Todas las funciones garantizan que las fechas se manejen correctamente en zona horaria de Perú
 */

const PERU_TIMEZONE = 'America/Lima'

/**
 * Formatea una fecha/hora para mostrar en zona horaria de Perú
 */
export function formatDateTimePeru(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PERU_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }

  return dateObj.toLocaleString('es-PE', { ...defaultOptions, ...options })
}

/**
 * Formatea solo la fecha en zona horaria de Perú
 */
export function formatDatePeru(date: Date | string): string {
  return formatDateTimePeru(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Formatea solo la hora en zona horaria de Perú
 */
export function formatTimePeru(date: Date | string): string {
  return formatDateTimePeru(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Obtiene la fecha y hora actual en zona horaria de Perú
 */
export function getCurrentDateTimePeru(): Date {
  // Crear una fecha que represente la hora actual en Perú
  const now = new Date()
  const peruTime = new Date(now.toLocaleString('en-US', { timeZone: PERU_TIMEZONE }))
  return peruTime
}

/**
 * Convierte una fecha UTC a zona horaria de Perú
 */
export function convertToPeruTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Date(dateObj.toLocaleString('en-US', { timeZone: PERU_TIMEZONE }))
}

/**
 * Formatea una fecha relativa (ej: "hace 2 horas") en español
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = getCurrentDateTimePeru()
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'ahora mismo'
  if (diffInMinutes < 60) return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
  if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
  if (diffInDays < 7) return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`

  return formatDateTimePeru(dateObj, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Genera un timestamp ISO string que representa la hora actual en Perú
 * IMPORTANTE: Este timestamp será guardado como UTC en la base de datos,
 * pero representa correctamente la hora de Perú
 */
export function getPeruTimestamp(): string {
  const now = new Date()
  // Crear una fecha que represente la hora actual en Perú
  const peruTime = new Date(now.toLocaleString('en-US', { timeZone: PERU_TIMEZONE }))
  // Convertir de vuelta a ISO string (que será UTC pero representando la hora de Perú)
  return peruTime.toISOString()
}

/**
 * Convierte cualquier fecha a timestamp ISO que represente esa hora en Perú
 */
export function toPeruISOString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const peruTime = new Date(dateObj.toLocaleString('en-US', { timeZone: PERU_TIMEZONE }))
  return peruTime.toISOString()
}

/**
 * Función de utilidad para asegurar que todas las inserciones usen zona horaria de Perú
 * Reemplaza new Date().toISOString() con getPeruTimestamp()
 */
export function nowPeru(): string {
  return getPeruTimestamp()
}
