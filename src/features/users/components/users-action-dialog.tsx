'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PasswordInput } from '@/components/password-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Trash2, Settings, GraduationCap, UserCheck } from 'lucide-react'
import { roles, statuses } from '../data/data'
import { type User } from '../data/schema'
import { addUser, updateUser } from '@/services/users'
import { getColegios, assignColegioToUser, removeColegioFromUser, getUserColegios } from '@/services/colegios'
import { toast } from 'sonner'
import { ColegioAsignado } from '@/types/auth'

const formSchema = z
  .object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    username: z.string().min(1, 'Username is required.'),
    phoneNumber: z.string().optional(),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Email is required.' : undefined),
    }),
    password: z.string().transform((pwd) => pwd.trim()),
    role: z.string().min(1, 'Role is required.'),
    status: z.string().min(1, 'Status is required.'),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length > 0
    },
    {
      message: 'Password is required.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return password.length >= 8
    },
    {
      message: 'Password must be at least 8 characters long.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /[a-z]/.test(password)
    },
    {
      message: 'Password must contain at least one lowercase letter.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /\d/.test(password)
    },
    {
      message: 'Password must contain at least one number.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    {
      message: "Passwords don't match.",
      path: ['confirmPassword'],
    }
  )
type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const [isLoading, setIsLoading] = useState(false)
  const [colegios, setColegios] = useState<any[]>([])
  const [userColegios, setUserColegios] = useState<ColegioAsignado[]>([])
  const [selectedColegio, setSelectedColegio] = useState('')
  const [selectedRole, setSelectedRole] = useState('teacher')
  const [isLoadingColegios, setIsLoadingColegios] = useState(false)
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          password: '',
          confirmPassword: '',
          isEdit,
        }
      : {
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          role: '',
          status: 'active',
          phoneNumber: '',
          password: '',
          confirmPassword: '',
          isEdit,
        },
  })

  useEffect(() => {
    if (open) {
      loadColegios()
      if (isEdit && currentRow) {
        loadUserColegios()
      }
    }
  }, [open, isEdit, currentRow])

  async function loadColegios() {
    try {
      const data = await getColegios()
      // Only show active colegios for assignment
      const activeColegios = data.filter(colegio => colegio.status === 'active')
      setColegios(activeColegios)
    } catch (error) {
      toast.error('Error al cargar los colegios activos')
    }
  }

  async function loadUserColegios() {
    if (!currentRow?.id) return
    
    try {
      // Usar el servicio correcto para obtener los colegios del usuario
      const userWithColegios = await getUserColegios(currentRow.id)
      setUserColegios(userWithColegios?.colegios || [])
    } catch (error) {
      console.error('Error loading user colegios:', error)
      // Si falla, usar los colegios del currentRow si existen
      setUserColegios(currentRow.colegios || [])
    }
  }

  const onSubmit = async (values: UserForm) => {
    setIsLoading(true)
    try {
      // Preparar los datos para enviar
      const userData = {
        name: `${values.firstName} ${values.lastName}`,
        username: values.username,
        email: values.email,
        role: values.role,
        status: values.status,
        // Solo incluir contraseña si se proporciona (para edición) o siempre (para creación)
        ...(values.password && { password: values.password })
      }

      if (isEdit && currentRow) {
        // Modo edición
        const updates: any = {
          name: `${values.firstName} ${values.lastName}`,
          username: values.username,
          email: values.email,
          role: values.role,
          status: values.status,
        }
        
        // Solo incluir contraseña si se proporciona una nueva
        if (values.password) {
          updates.password = values.password
        }

        await updateUser(currentRow.id, updates)
        toast.success('Usuario actualizado correctamente')
      } else {
        // Modo creación
        await addUser(userData as any)
        toast.success('Usuario creado correctamente')
      }

      form.reset()
      onOpenChange(false)
      
      // Recargar la página para mostrar los cambios
      window.location.reload()
      
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(isEdit ? 'Error al actualizar el usuario' : 'Error al crear el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAssignColegio() {
    if (!selectedColegio || !currentRow?.id) {
      toast.error('Por favor selecciona un colegio')
      return
    }

    setIsLoadingColegios(true)
    try {
      await assignColegioToUser(currentRow.id, selectedColegio, selectedRole as any, 'current_user')
      
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
      setIsLoadingColegios(false)
    }
  }

  async function handleRemoveColegio(colegioId: string) {
    if (!currentRow?.id) return

    setIsLoadingColegios(true)
    try {
      await removeColegioFromUser(currentRow.id, colegioId)
      setUserColegios(userColegios.filter(uc => uc.id !== colegioId))
      toast.success('Colegio removido correctamente')
    } catch (error) {
      toast.error('Error al remover colegio')
    } finally {
      setIsLoadingColegios(false)
    }
  }

  function getRoleIcon(role: string) {
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

  function getRoleLabel(role: string) {
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

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update user information. Password fields are optional - leave blank to keep current password.' 
              : 'Create new user here. All fields including password are required.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='John'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Doe'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='john_doe'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='john.doe@gmail.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Phone Number
                      {!isEdit && <span className='text-red-500 ml-1'>*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='+123456789'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                    {isEdit && (
                      <div className='col-span-4 col-start-3 text-xs text-muted-foreground'>
                        Optional field
                      </div>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className='col-span-4'>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map(({ label, value }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Status
                      <span className='text-red-500 ml-1'>*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className='col-span-4'>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map(({ label, value }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Password
                      {!isEdit && <span className='text-red-500 ml-1'>*</span>}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={isEdit ? 'Leave blank to keep current password' : 'e.g., S3cur3P@ssw0rd'}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                    {isEdit && (
                      <div className='col-span-4 col-start-3 text-xs text-muted-foreground'>
                        Leave blank to keep current password
                      </div>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Confirm Password
                      {!isEdit && <span className='text-red-500 ml-1'>*</span>}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        disabled={!isPasswordTouched}
                        placeholder={isEdit ? 'Confirm new password' : 'e.g., S3cur3P@ssw0rd'}
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                    {isEdit && !isPasswordTouched && (
                      <div className='col-span-4 col-start-3 text-xs text-muted-foreground'>
                        Optional - only required if changing password
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {/* Sección de Colegios - solo en modo edición */}
          {isEdit && (
            <div className="mt-6 space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Colegios Asignados
                </h3>
                
                {/* Asignar nuevo colegio */}
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-base">Asignar Nuevo Colegio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Colegio</label>
                        <Select value={selectedColegio} onValueChange={setSelectedColegio}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un colegio" />
                          </SelectTrigger>
                          <SelectContent>
                            {colegios
                              .filter(c => !userColegios.some(uc => uc.id === c.id))
                              .map(colegio => (
                                <SelectItem key={colegio.id} value={colegio.id}>
                                  {colegio.name} ({colegio.code})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rol</label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="teacher">Docente</SelectItem>
                            <SelectItem value="staff">Personal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      onClick={handleAssignColegio}
                      disabled={!selectedColegio || isLoadingColegios}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Asignar Colegio
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de colegios asignados */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Colegios Actuales</h4>
                  {userColegios.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground border rounded-lg">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <RoleIcon className="h-3 w-3" />
                                    {getRoleLabel(colegio.role)}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveColegio(colegio.id)}
                                    disabled={isLoadingColegios}
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
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            type='submit' 
            form='user-form'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
