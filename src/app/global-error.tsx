'use client'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
          <h2>Something went critically wrong!</h2>
          <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', marginTop: '12px', maxWidth: '80%' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Error Message:</p>
            <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: '14px' }}>{error.message || 'No specific error message provided.'}</p>
            {error.digest && <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#b91c1c' }}>Digest: {error.digest}</p>}
          </div>
          <button 
            onClick={() => reset()}
            style={{ padding: '8px 16px', background: 'black', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', marginTop: '16px' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
