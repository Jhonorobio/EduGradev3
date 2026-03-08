import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getActiveColegiosForUser } from '@/services/colegios'
import { UserWithColegios } from '@/types/colegio'

export function useActiveColegios() {
  const { auth } = useAuthStore()
  const user = auth.user

  return useQuery({
    queryKey: ['active-colegios', user?.id],
    queryFn: () => user ? getActiveColegiosForUser(user.id) : null,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useActiveColegiosList() {
  const { data: userWithColegios, ...query } = useActiveColegios()
  
  return {
    ...query,
    colegios: userWithColegios?.colegios || [],
    hasActiveColegios: (userWithColegios?.colegios?.length || 0) > 0
  }
}
