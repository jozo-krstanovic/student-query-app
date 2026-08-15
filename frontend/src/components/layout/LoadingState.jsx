import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoadingState({ message = 'Loading...', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground', className)}>
      <Loader2 className="size-4 animate-spin" />
      {message}
    </div>
  )
}
