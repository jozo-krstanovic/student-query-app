import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-7xl',
}

export default function PageContainer({ size = 'lg', className, children }) {
  return <div className={cn('mx-auto space-y-6 p-6', SIZES[size], className)}>{children}</div>
}
