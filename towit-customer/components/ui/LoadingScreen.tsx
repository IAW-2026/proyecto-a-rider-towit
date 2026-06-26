export default function LoadingScreen({ className = "min-h-screen" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className} bg-background`}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-yellow border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}
