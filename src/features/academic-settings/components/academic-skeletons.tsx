import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function PeriodsSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-4 sm:gap-6'>
      {/* Header skeleton */}
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>

      {/* Cards skeleton */}
      <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-5 w-5' />
              <Skeleton className='h-6 w-40' />
            </div>
            <Skeleton className='h-4 w-48 mt-2' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-10 w-full' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-4 w-56 mt-2' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex items-center space-x-4'>
                  <Skeleton className='h-4 w-24' />
                  <div className='flex items-center space-x-2 flex-1'>
                    <Skeleton className='h-10 w-20' />
                    <Skeleton className='h-4 w-8' />
                  </div>
                </div>
              ))}
              <div className='pt-4 border-t'>
                <div className='flex justify-between items-center'>
                  <Skeleton className='h-4 w-12' />
                  <Skeleton className='h-4 w-8' />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-48 mt-2' />
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='text-center p-4 border rounded-lg'>
                <Skeleton className='h-8 w-12 mx-auto mb-2' />
                <Skeleton className='h-4 w-20 mx-auto' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function SubjectsSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-4 sm:gap-6'>
      {/* Header skeleton */}
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-56' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>

      {/* Cards grid skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-5 w-5' />
                  <Skeleton className='h-6 w-32' />
                </div>
                <Skeleton className='h-6 w-16' />
              </div>
              <Skeleton className='h-4 w-48 mt-2' />
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-8' />
                </div>
                <div className='flex justify-between text-sm'>
                  <Skeleton className='h-4 w-12' />
                  <Skeleton className='h-6 w-16' />
                </div>
                <div className='flex gap-2 pt-2'>
                  <Skeleton className='h-8 w-16' />
                  <Skeleton className='h-8 w-16' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function GradesSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-4 sm:gap-6'>
      {/* Header skeleton */}
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-28' />
          <Skeleton className='h-4 w-52' />
        </div>
        <Skeleton className='h-10 w-28' />
      </div>

      {/* Cards grid skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-5 w-5' />
                  <Skeleton className='h-6 w-36' />
                </div>
                <Skeleton className='h-6 w-12' />
              </div>
              <Skeleton className='h-4 w-32 mt-2' />
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between text-sm'>
                  <div className='flex items-center gap-1'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <Skeleton className='h-4 w-16' />
                </div>
                <div className='flex justify-between text-sm'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <Skeleton className='w-full h-2' />
                <div className='flex gap-2 pt-2'>
                  <Skeleton className='h-8 w-16' />
                  <Skeleton className='h-8 w-16' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AssignmentsSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-4 sm:gap-6'>
      {/* Header skeleton */}
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-36' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-10 w-36' />
      </div>

      {/* Cards grid skeleton */}
      <div className='grid gap-4 md:grid-cols-1 lg:grid-cols-2'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-5 w-5' />
                  <Skeleton className='h-6 w-32' />
                </div>
                <Skeleton className='h-6 w-20' />
              </div>
              <Skeleton className='h-4 w-28 mt-2' />
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <div className='flex gap-2 pt-2'>
                  <Skeleton className='h-8 w-16' />
                  <Skeleton className='h-8 w-16' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
