'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
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
import { SelectDropdown } from '@/components/select-dropdown'
import { colegioStatuses } from '../data/data'
import { type Colegio } from '../data/schema'
import { getColegios, addColegio, updateColegio } from '@/services/colegios'
import { toast } from 'sonner'

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    code: z.string().min(1, 'Code is required.'),
    address: z.string().min(1, 'Address is required.'),
    phone: z.string().min(1, 'Phone is required.'),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Email is required.' : undefined),
    }),
    status: z.string().min(1, 'Status is required.'),
    isEdit: z.boolean(),
  })

type ColegioForm = z.infer<typeof formSchema>

type ColegioActionDialogProps = {
  currentRow?: Colegio
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ColegiosActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ColegioActionDialogProps) {
  const isEdit = !!currentRow
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<ColegioForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          isEdit,
        }
      : {
          name: '',
          code: '',
          address: '',
          phone: '',
          email: '',
          status: 'active',
          isEdit,
        },
  })

  const onSubmit = async (values: ColegioForm) => {
    setIsLoading(true)
    try {
      if (isEdit && currentRow) {
        // Modo edición
        const updates = {
          name: values.name,
          code: values.code,
          address: values.address,
          phone: values.phone,
          email: values.email,
          status: values.status,
        }

        await updateColegio(currentRow.id, updates)
        toast.success('Colegio actualizado correctamente')
      } else {
        // Modo creación
        const newColegio = {
          name: values.name,
          code: values.code,
          address: values.address,
          phone: values.phone,
          email: values.email,
          status: values.status,
        }

        await addColegio(newColegio as any)
        toast.success('Colegio creado correctamente')
      }

      form.reset()
      onOpenChange(false)
      
      // Notificar que los datos han cambiado para que el componente padre actualice
      window.dispatchEvent(new CustomEvent('colegios-data-changed'))
      
    } catch (error) {
      console.error('Error saving colegio:', error)
      toast.error(isEdit ? 'Error al actualizar el colegio' : 'Error al crear el colegio')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Colegio' : 'Add New Colegio'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update colegio information here.' 
              : 'Create new colegio here. All fields are required.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='colegio-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., Colegio San José'
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
                name='code'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., CSJ001'
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
                name='address'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., Calle Principal #123'
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
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='+1234567890'
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
                        placeholder='info@colegio.edu'
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
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Status</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a status'
                      className='col-span-4'
                      items={colegioStatuses.map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button 
            type='submit' 
            form='colegio-form'
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
