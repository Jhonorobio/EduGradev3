'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building2, GraduationCap, Settings, UserCheck } from 'lucide-react'

interface ActiveColegiosSelectorProps {
  selectedColegio?: string
  onColegioChange: (colegioId: string) => void
  className?: string
}

export function ActiveColegiosSelector({ 
  selectedColegio, 
  onColegioChange, 
  className = '' 
}: ActiveColegiosSelectorProps) {
  const { activeColegios, hasActiveColegios } = useAuth()

  if (!hasActiveColegios) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        No tienes colegios activos asignados
      </div>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Settings
      case 'teacher':
        return GraduationCap
      case 'staff':
        return UserCheck
      default:
        return UserCheck
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'teacher':
        return 'Docente'
      case 'staff':
        return 'Personal'
      default:
        return role
    }
  }

  return (
    <Select value={selectedColegio} onValueChange={onColegioChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Selecciona un colegio activo" />
      </SelectTrigger>
      <SelectContent>
        {activeColegios.map((colegio) => {
          const RoleIcon = getRoleIcon(colegio.role)
          return (
            <SelectItem key={colegio.id} value={colegio.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{colegio.name}</div>
                  <div className="text-sm text-muted-foreground">{colegio.code}</div>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <RoleIcon className="h-3 w-3" />
                  {getRoleLabel(colegio.role)}
                </Badge>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
