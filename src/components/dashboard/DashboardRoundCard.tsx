import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { formatRoundDate } from "@/lib/utils/date";

interface DashboardRoundCardProps {
  round: any;
  availability?: any;
  declarations?: any;
  canEnterScore: boolean;
}

const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  in_progress: { bg: "bg-success", text: "text-white", label: "⛳ Playing" },
  scoring: { bg: "bg-success", text: "text-white", label: "📋 Scoring" },
  completed: { bg: "bg-blue-500", text: "text-white", label: "✓ Completed" },
  availability_open: {
    bg: "bg-warning",
    text: "text-neutral-900",
    label: "⏰ Declare",
  },
  foursomes_set: { bg: "bg-secondary", text: "text-white", label: "✓ Foursomes Set" },
  scheduled: { bg: "bg-neutral-400", text: "text-white", label: "📅 Scheduled" },
};

export function DashboardRoundCard({
  round,
  availability,
  declarations,
  canEnterScore,
}: DashboardRoundCardProps) {
  const roundDate = formatRoundDate(round.round_date);
  const badgeStyle = STATUS_BADGE_STYLES[round.status] || STATUS_BADGE_STYLES.scheduled;
  const roundEnded = round.status === "completed";

  return (
    <Card>
      {/* Header */}
      <div className="flex justify-between items-start gap-md mb-md">
        <div>
          <h3 className="text-h4 mb-xs">Round {round.round_number}</h3>
          <p className="text-small text-neutral-700">{roundDate}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <span className={`inline-flex items-center ${badgeStyle.bg} ${badgeStyle.text} text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap`}>
            {badgeStyle.label}
          </span>
          {availability && !roundEnded && (
            <span
              className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                availability.status === "in"
                  ? "bg-success text-white"
                  : availability.status === "out"
                  ? "bg-danger text-white"
                  : "bg-warning text-neutral-900"
              }`}
            >
              {availability.status === "in"
                ? "✓ In"
                : availability.status === "out"
                ? "✗ Out"
                : "⚠ Undeclared"}
            </span>
          )}
        </div>
      </div>

      {/* Declaration Status */}
      {!roundEnded &&
        ["availability_open", "foursomes_set"].includes(round.status) &&
        declarations && (
          <div className="mb-md pb-md border-b border-neutral-100">
            <div className="space-y-2">
              {declarations.declared.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                    Declared ({declarations.declared.length}/
                    {declarations.declared.length + declarations.notDeclared.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {declarations.declared.map((team: any) => (
                      <span
                        key={team.teamId}
                        className="inline-block bg-success text-white text-xs px-2 py-1 rounded"
                      >
                        ✓ T{team.teamNumber}: {team.golferName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {declarations.notDeclared.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                    Not Declared ({declarations.notDeclared.length}/
                    {declarations.declared.length + declarations.notDeclared.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {declarations.notDeclared.map((team: any) => (
                      <span
                        key={team.teamId}
                        className="inline-block bg-danger text-white text-xs px-2 py-1 rounded"
                      >
                        ✗ T{team.teamNumber}: {team.teamName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Actions */}
      <div className="flex flex-col gap-2 md:flex-row">
        {availability && availability.status === "undeclared" && !roundEnded && (
          <Button variant="secondary" asChild className="flex-1">
            <Link href={`/availability/${round.id}`}>
              Declare Availability
            </Link>
          </Button>
        )}
        {canEnterScore && (
          <Button variant="primary" asChild className="flex-1">
            <Link href={`/scores/${round.id}`}>
              Enter My Score
            </Link>
          </Button>
        )}
        {!roundEnded && (
          <Button variant="ghost" asChild className="flex-1">
            <Link href={`/rounds/${round.id}`}>
              Declare Golfers
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
