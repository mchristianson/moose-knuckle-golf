import Link from 'next/link'
import { CreateSubForm } from '@/components/subs/create-sub-form'

export default function NewSubPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/subs" className="text-green-600 hover:text-green-700 text-sm">
          ← Back to Subs
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Add New Sub</h1>

      <div className="max-w-xl">
        <CreateSubForm />
      </div>
    </div>
  )
}
