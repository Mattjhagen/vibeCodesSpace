const APP_HOME = `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'vibecodes.space'}`
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
      <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
      <p className="text-muted-foreground mb-8">We could not find the page you were looking for.</p>
      <a href={APP_HOME} className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
        Return Home
      </a>
    </div>
  )
}
