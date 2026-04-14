import { stopImpersonation } from '@/lib/actions/impersonation'

interface Props {
  name: string
}

export function ImpersonationBanner({ name }: Props) {
  return (
    <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium">
      <span>
        Viewing as <strong>{name}</strong> — Profile page shows your own account
      </span>
      <form action={stopImpersonation}>
        <button
          type="submit"
          className="bg-black text-amber-400 px-3 py-1 rounded font-semibold hover:bg-zinc-800 transition-colors text-xs"
        >
          Stop Impersonating
        </button>
      </form>
    </div>
  )
}
