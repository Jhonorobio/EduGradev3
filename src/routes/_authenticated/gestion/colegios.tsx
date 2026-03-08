import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/gestion/colegios')({
  component: Outlet,
})
