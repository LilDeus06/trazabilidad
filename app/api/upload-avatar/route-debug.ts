import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("[v0] 🚀 Iniciando subida de avatar")

  try {
    const response = NextResponse.next()
    const supabase = createRouteHandlerClient(request, response)

    console.log("[v0] 🔐 Verificando autenticación...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] ❌ Error de autenticación:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("[v0] ✅ Usuario autenticado:", user.id)

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] ❌ No se proporcionó archivo")
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    console.log("[v0] 📁 Archivo recibido:", {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      console.error("[v0] ❌ Tipo de archivo no permitido:", file.type)
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      console.error("[v0] ❌ Archivo demasiado grande:", file.size)
      return NextResponse.json({ error: "Archivo demasiado grande (máximo 5MB)" }, { status: 400 })
    }

    console.log("[v0] 🗑️ Verificando avatar anterior...")
    // Obtener avatar actual para eliminarlo
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[v0] ❌ Error obteniendo perfil:", profileError)
      return NextResponse.json({ error: "Error obteniendo perfil" }, { status: 500 })
    }

    console.log("[v0] 📋 Perfil obtenido:", { hasAvatar: !!profile?.avatar_url })

    // Eliminar avatar anterior si existe (solo si es de Supabase Storage)
    if (profile?.avatar_url && profile.avatar_url.includes('supabase')) {
      console.log("[v0] 🗑️ Eliminando avatar anterior...")
      try {
        // Extraer el path del archivo de la URL
        const urlParts = profile.avatar_url.split('/')
        const fileName = urlParts[urlParts.length - 1]

        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([fileName])

        if (deleteError) {
          console.warn("[v0] ⚠️ Error eliminando avatar anterior:", deleteError)
        } else {
          console.log("[v0] ✅ Avatar anterior eliminado")
        }
      } catch (error) {
        console.warn("[v0] ⚠️ Error eliminando avatar anterior:", error)
      }
    }

    console.log("[v0] 📤 Subiendo nuevo avatar...")
    // Subir nuevo avatar a Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`

    console.log("[v0] 📁 Nombre del archivo:", fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error("[v0] ❌ Error subiendo archivo:", uploadError)
      return NextResponse.json({
        error: "Error subiendo archivo",
        details: uploadError.message,
        code: uploadError.statusCode
      }, { status: 500 })
    }

    console.log("[v0] ✅ Archivo subido exitosamente:", uploadData)

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    console.log("[v0] 🔗 URL pública generada:", publicUrl)

    // Actualizar perfil en base de datos
    console.log("[v0] 💾 Actualizando perfil en base de datos...")
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] ❌ Error actualizando perfil:", updateError)
      // Eliminar archivo subido si falla la actualización
      await supabase.storage.from('avatars').remove([fileName])
      return NextResponse.json({
        error: "Error actualizando perfil",
        details: updateError.message,
        code: updateError.code
      }, { status: 500 })
    }

    console.log("[v0] 🎉 Avatar subido exitosamente:", publicUrl)

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error("[v0] 💥 Error general en subida de avatar:", error)
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
