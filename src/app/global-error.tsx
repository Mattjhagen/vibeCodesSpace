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
