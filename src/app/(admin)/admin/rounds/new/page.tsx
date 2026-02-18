import { CreateRoundForm } from "@/components/rounds/create-round-form";
import Link from "next/link";

export default function NewRoundPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/rounds" className="text-green-600 hover:text-green-700 text-sm">
          ← Back to Rounds
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create Round</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <CreateRoundForm />
      </div>
    </div>
  );
}
