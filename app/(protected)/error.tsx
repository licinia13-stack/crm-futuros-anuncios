'use client'
import { useEffect } from 'react'
export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error)
  }, [error])
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Algo deu errado</h2>
      <pre style={{ fontSize: '12px', color: 'red', marginTop: '1rem', textAlign: 'left', whiteSpace: 'pre-wrap', maxWidth: '600px', margin: '1rem auto' }}>
        {error?.message}
        {error?.stack}
      </pre>
      <button onClick={() => reset()}>Tentar novamente</button>
    </div>
  )
}
