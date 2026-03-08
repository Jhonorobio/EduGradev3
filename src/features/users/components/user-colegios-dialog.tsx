import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SelectDropdown } from '@/components/select-dropdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Plus, Trash2, UserCheck, GraduationCap, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { ColegioAsignado } from '@/types/auth'
import { getColegios, assignColegioToUser, removeColegioFromUser } from '@/services/colegios'

interface UserColegiosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    colegios?: ColegioAsignado[]
  }
}

const colegioRoles = [
  {
    label: 'Administrador',
    value: 'admin',
    icon: Settings,
  },
  {
    label: 'Docente',
    value: 'teacher',
    icon: GraduationCap,
  },
  {
    label: 'Personal',
    value: 'staff',
    icon: UserCheck,
  },
] as const

export function UserColegiosDialog({ open, onOpenChange, user }: UserColegiosDialogProps) {
  const [colegios, setColegios] = useState<any[]>([])
  const [userColegios, setUserColegios] = useState<ColegioAsignado[]>(user.colegios || [])
  const [selectedColegio, setSelectedColegio] = useState('')
  const [selectedRole, setSelectedRole] = useState('teacher')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadActiveColegios()
      setUserColegios(user.colegios || [])
    }
  }, [open, user])

  async function loadActiveColegios() {
    try {
      const data = await getColegios()
      // Only show active colegios for assignment
      const activeColegios = data.filter(colegio => colegio.status === 'active')
      setColegios(activeColegios)
    } catch (error) {
      toast.error('Error al cargar los colegios activos')
    }
  }

  async function handleAssignColegio() {
    if (!selectedColegio) {
      toast.error('Por favor selecciona un colegio')
      return
    }

    setIsLoading(true)
    try {
      await assignColegioToUser(user.id, selectedColegio, selectedRole as any, 'current_user')
      
      // Refresh user colegios
      const newColegio = colegios.find(c => c.id === selectedColegio)
      if (newColegio) {
        const newAssignment: ColegioAsignado = {
          id: selectedColegio,
          name: newColegio.name,
          code: newColegio.code,
          role: selectedRole as any,
          assigned_at: new Date().toISOString()
        }
        setUserColegios([...userColegios, newAssignment])
      }
      
      setSelectedColegio('')
      setSelectedRole('teacher')
      toast.success('Colegio asignado correctamente')
    } catch (error) {
      toast.error('Error al asignar colegio')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemoveColegio(colegioId: string) {
    setIsLoading(true)
    try {
      await removeColegioFromUser(user.id, colegioId)
      setUserColegios(userColegios.filter(uc => uc.id !== colegioId))
      toast.success('Colegio removido correctamente')
    } catch (error) {
      toast.error('Error al remover colegio')
    } finally {
      setIsLoading(false)
    }
  }

  function getRoleIcon(role: string) {
    const roleConfig = colegioRoles.find(r => r.value === role)
    return roleConfig ? roleConfig.icon : UserCheck
  }

  function getRoleLabel(role: string) {
    const roleConfig = colegioRoles.find(r => r.value === role)
    return roleConfig ? roleConfig.label : role
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case 'admin':
        return 'default'
      case 'teacher':
        return 'secondary'
      case 'staff':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Colegios Asignados - {user.name}
          </DialogTitle>
          <DialogDescription>
            Gestiona los colegios asignados a este usuario y sus roles específicos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asignar nuevo colegio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asignar Nuevo Colegio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Colegio</label>
                  <SelectDropdown
                    defaultValue={selectedColegio}
                    onValueChange={setSelectedColegio}
                    placeholder="Selecciona un colegio"
                    items={colegios
                      .filter(c => !userColegios.some(uc => uc.id === c.id))
                      .map(colegio => ({
                        label: `${colegio.name} (${colegio.code})`,
                        value: colegio.id,
                      }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Rol</label>
                  <SelectDropdown
                    defaultValue={selectedRole}
                    onValueChange={setSelectedRole}
                    placeholder="Selecciona un rol"
                    items={colegioRoles.map(({ label, value }) => ({
                      label,
                      value,
                    }))}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAssignColegio}
                disabled={!selectedColegio || isLoading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Asignar Colegio
              </Button>
            </CardContent>
          </Card>

          {/* Lista de colegios asignados */}
          <div className="space-y-3">
            <h3 className="text-base font-medium">Colegios Asignados</h3>
            {userColegios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Este usuario no tiene colegios asignados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userColegios.map((colegio) => {
                  const RoleIcon = getRoleIcon(colegio.role)
                  return (
                    <Card key={colegio.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{colegio.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {colegio.code} • Asignado el {new Date(colegio.assigned_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(colegio.role)} className="flex items-center gap-1">
                              <RoleIcon className="h-3 w-3" />
                              {getRoleLabel(colegio.role)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveColegio(colegio.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
