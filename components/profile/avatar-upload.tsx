"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AvatarUploadProps {
  currentAvatar?: string | null
  userName: string
  onAvatarUpdate: (url: string) => void
}

export function AvatarUpload({ currentAvatar, userName, onAvatarUpdate }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("[v0] Archivo seleccionado:", file.name, file.type, file.size)

    // Validaciones del lado cliente
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos JPG, PNG, GIF o WebP",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      })
      return
    }

    // Mostrar preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      console.log("[v0] Enviando archivo al servidor")
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error subiendo archivo")
      }

      console.log("[v0] Avatar subido exitosamente:", result.url)
      onAvatarUpdate(result.url)
      setPreview(null)

      toast({
        title: "Éxito",
        description: "Avatar actualizado correctamente",
      })
    } catch (error) {
      console.error("[v0] Error subiendo avatar:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error subiendo archivo",
        variant: "destructive",
      })
      setPreview(null)
    } finally {
      setIsUploading(false)
      // Limpiar input
      event.target.value = ""
    }
  }

  const cancelPreview = () => {
    setPreview(null)
    setIsUploading(false)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={preview || currentAvatar || undefined} alt={userName} className="object-cover" />
          <AvatarFallback className="text-lg">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {preview && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={cancelPreview}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          id="avatar-upload"
        />

        <label htmlFor="avatar-upload">
          <Button variant="outline" disabled={isUploading} className="cursor-pointer bg-transparent" asChild>
            <span>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Cambiar Avatar
                </>
              )}
            </span>
          </Button>
        </label>

        <p className="text-xs text-muted-foreground text-center">JPG, PNG, GIF o WebP. Máximo 5MB.</p>
      </div>
    </div>
  )
}
