import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const supabase = createRouteHandlerClient(request, response)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande (máximo 5MB)" }, { status: 400 })
    }

    // Obtener avatar actual para eliminarlo
    const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

    // Eliminar avatar anterior si existe (solo si es de Supabase Storage)
    if (profile?.avatar_url && profile.avatar_url.includes('supabase')) {
      try {
        // Extraer el path del archivo de la URL
        const urlParts = profile.avatar_url.split('/')
        const fileName = urlParts[urlParts.length - 1]

        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([fileName])

        if (deleteError) {
          // Error eliminando avatar anterior
        }
      } catch (error) {
        // Error eliminando avatar anterior
      }
    }

    // Subir nuevo avatar a Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ error: "Error subiendo archivo" }, { status: 500 })
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Actualizar perfil en base de datos
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id)

    if (updateError) {
      // Eliminar archivo subido si falla la actualización
      await supabase.storage.from('avatars').remove([fileName])
      return NextResponse.json({ error: "Error actualizando perfil" }, { status: 500 })
    }

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
