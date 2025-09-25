// Sistema de debugging y monitoreo para Supabase
export class SupabaseDebugger {
  private static instance: SupabaseDebugger
  private logs: Array<{ timestamp: Date; level: string; message: string; data?: any }> = []

  static getInstance(): SupabaseDebugger {
    if (!SupabaseDebugger.instance) {
      SupabaseDebugger.instance = new SupabaseDebugger()
    }
    return SupabaseDebugger.instance
  }

  log(level: "info" | "warn" | "error", message: string, data?: any) {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    }

    this.logs.push(logEntry)
    console.log(`[v0-supabase-${level}] ${message}`, data || "")

    // Mantener solo los últimos 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100)
    }
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }

  // Verificar configuración de variables de entorno
  checkEnvironmentVariables() {
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    const missing = requiredVars.filter((varName) => !process.env[varName])

    if (missing.length > 0) {
      this.log("error", "Variables de entorno faltantes", { missing })
      return false
    }

    this.log("info", "Variables de entorno configuradas correctamente")
    return true
  }

  // Verificar formato de URL de Supabase
  validateSupabaseUrl(url: string) {
    const supabaseUrlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/
    const isValid = supabaseUrlPattern.test(url)

    if (!isValid) {
      this.log("error", "URL de Supabase inválida", { url })
    } else {
      this.log("info", "URL de Supabase válida", { url })
    }

    return isValid
  }
}
