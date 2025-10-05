/**
 * Utilidades para manejo de fechas y horas en zona horaria de Perú
 */

const PERU_TIMEZONE = 'America/Lima'

/**
 * Formatea una fecha/hora para mostrar en zona horaria de Perú
 */
export function formatDateTimePeru(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC',
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
  // Crear una fecha en UTC y convertirla a zona horaria de Perú
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
