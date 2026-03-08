import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/planillas/simple-test')({
  component: () => {
    console.log('SIMPLE TEST: Component rendering!')
    return (
      <div style={{ padding: '20px', background: 'lightblue', margin: '20px' }}>
        <h1>Simple Test Route Working!</h1>
        <p>Si ves esto, el enrutamiento básico funciona.</p>
      </div>
    )
  }
})
