import { cn } from '../../lib/utils'

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground', className)}
      {...props}
    />
  )
}
