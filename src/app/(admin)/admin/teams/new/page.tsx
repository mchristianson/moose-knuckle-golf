import { CreateTeamForm } from "@/components/teams/create-team-form";
import Link from "next/link";

export default function NewTeamPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/teams" className="text-green-600 hover:text-green-700 text-sm">
          ← Back to Teams
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create Team</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <CreateTeamForm />
      </div>
    </div>
  );
}
