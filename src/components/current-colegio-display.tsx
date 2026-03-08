'use client'

import { useState, useEffect } from 'react'
import { useActiveColegiosList } from '@/hooks/use-active-colegios'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, GraduationCap, Settings, UserCheck, Shield } from 'lucide-react'

export function CurrentColegioDisplay() {
  const { colegios, hasActiveColegios } = useActiveColegiosList()
  const { isSuperAdmin } = useAuth()
  const [selectedColegio, setSelectedColegio] = useState<string>('')

  useEffect(() => {
    // Initialize with first active colegio if none selected
    if (hasActiveColegios && !selectedColegio && colegios.length > 0) {
      setSelectedColegio(colegios[0].id)
    }
  }, [colegios, hasActiveColegios, selectedColegio])

  // SUPER_ADMIN doesn't need colegios display
  if (isSuperAdmin) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-blue-600" />
        <span className="font-medium">Super Admin</span>
        <Badge variant="outline" className="ml-2">
          Acceso Total
        </Badge>
      </div>
    )
  }

  if (!hasActiveColegios) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Sin colegios activos</span>
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

  const currentColegio = colegios.find(c => c.id === selectedColegio)

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Colegio:</span>
      </div>
      
      {colegios.length === 1 ? (
        // Single colegio - just display it
        <div className="flex items-center gap-2">
          <span className="text-sm">{colegios[0].name}</span>
          <Badge variant="outline" className="flex items-center gap-1">
            {(() => {
              const RoleIcon = getRoleIcon(colegios[0].role)
              return <RoleIcon className="h-3 w-3" />
            })()}
            {getRoleLabel(colegios[0].role)}
          </Badge>
        </div>
      ) : (
        // Multiple colegios - show selector
        <Select value={selectedColegio} onValueChange={setSelectedColegio}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecciona colegio" />
          </SelectTrigger>
          <SelectContent>
            {colegios.map((colegio) => {
              const RoleIcon = getRoleIcon(colegio.role)
              return (
                <SelectItem key={colegio.id} value={colegio.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-sm">{colegio.name}</div>
                      <div className="text-xs text-muted-foreground">{colegio.code}</div>
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
      )}
    </div>
  )
}
