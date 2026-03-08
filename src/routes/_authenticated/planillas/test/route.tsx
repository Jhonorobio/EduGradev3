import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/planillas/test')({
  component: () => {
    try {
      console.log('Test route component starting...')
      const element = <div>Test route is working!</div>
      console.log('Test route component rendered successfully')
      return element
    } catch (error) {
      console.error('Error in test route component:', error)
      return <div>Error: {error.message}</div>
    }
  },
  errorComponent: ({ error }) => {
    console.error('Route error:', error)
    return <div>Route Error: {error.message}</div>
  }
})
