'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error Handled:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-red-50 text-red-900 font-sans">
      <h2 className="text-2xl font-bold mb-4">Dashboard Error Hook</h2>
      <div className="bg-white p-6 border border-red-200 rounded-xl shadow-sm max-w-2xl w-full">
        <p className="font-bold mb-2">Message:</p>
        <pre className="p-4 bg-muted rounded-lg text-sm overflow-auto mb-4 border whitespace-pre-wrap">
          {error.message || 'No specific error message available.'}
        </pre>
        {error.digest && (
          <p className="text-xs text-red-700/50 italic mb-6">Digest: {error.digest}</p>
        )}
        <button
          onClick={() => reset()}
          className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Retry Load
        </button>
      </div>
      <p className="mt-8 text-sm text-red-700/60">Note: This is a diagnostic screen for development troubleshooting.</p>
    </div>
  )
}
