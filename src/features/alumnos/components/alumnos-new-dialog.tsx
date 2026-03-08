import React, { useState, useEffect } from 'react'
import { z } from 'zod'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAlumnosStore } from '../store/alumnos-store'
import { getColegios } from '@/services/colegios'
import { getGrades } from '@/services/grades'
import { createAlumno } from '@/services/alumnos'
import { type Alumno } from '../data/schema'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  colegio_id: z.string().min(1, 'Colegio is required'),
  grade_id: z.string().min(1, 'Grade is required'),
  status: z.enum(['active', 'inactive', 'suspended']),
})

type FormValues = z.infer<typeof formSchema>

interface AlumnosNewDialogProps {
  open: boolean
}

export function AlumnosNewDialog({ open }: AlumnosNewDialogProps) {
  const { setIsNewDialogOpen } = useAlumnosStore()
  const [isLoading, setIsLoading] = useState(false)
  const [colegios, setColegios] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])

  useEffect(() => {
    // Load colegios and grades for the form
    const loadData = async () => {
      try {
        const [colegiosData, gradesData] = await Promise.all([
          getColegios(),
          getGrades()
        ])
        
        setColegios(colegiosData || [])
        setGrades(gradesData || [])
      } catch (error) {
        console.error('Error loading data for form:', error)
        setColegios([])
        setGrades([])
      }
    }

    loadData()
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      last_name: '',
      colegio_id: '',
      grade_id: '',
      status: 'active',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      // Crear alumno en la base de datos
      const newAlumno = await createAlumno({
        name: values.name,
        last_name: values.last_name,
        colegio_id: values.colegio_id,
        grade_id: values.grade_id,
        status: values.status,
      })

      toast.success('Alumno creado exitosamente')
      form.reset()
      setIsNewDialogOpen(false)
      
      // Notify that data has changed
      window.dispatchEvent(new CustomEvent('alumnos-data-changed'))
    } catch (error) {
      console.error('Error creating alumno:', error)
      toast.error('Error al crear el alumno')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setIsNewDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Nuevo Alumno</DialogTitle>
          <DialogDescription>
            Crea un nuevo alumno en el sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres</FormLabel>
                  <FormControl>
                    <Input placeholder='Ej: Ana Sofía' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='last_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl>
                    <Input placeholder='Ej: Martínez Pérez' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='colegio_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colegio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecciona un colegio' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colegios.map((colegio) => (
                        <SelectItem key={colegio.id} value={colegio.id}>
                          {colegio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='grade_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecciona un grado' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecciona un status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                      <SelectItem value='suspended'>Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Alumno'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
