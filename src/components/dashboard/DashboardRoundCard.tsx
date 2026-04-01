import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { formatRoundDate } from "@/lib/utils/date";
import { Icon } from "@/components/Icon";
import { FlagIcon, ClipboardDocumentListIcon, CheckIcon, ClockIcon, CalendarIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface DashboardRoundCardProps {
  round: any;
  availability?: any;
  declarations?: any;
  canEnterScore: boolean;
  foursomes?: any[];
}

function getMemberName(m: any): string {
  return m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? '—'
}

const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  in_progress: { bg: "bg-success", text: "text-white", label: "Playing", icon: FlagIcon },
  scoring: { bg: "bg-success", text: "text-white", label: "Scoring", icon: ClipboardDocumentListIcon },
  completed: { bg: "bg-blue-500", text: "text-white", label: "Completed", icon: CheckIcon },
  availability_open: {
    bg: "bg-warning",
    text: "text-neutral-900",
    label: "Declare",
    icon: ClockIcon,
  },
  foursomes_set: { bg: "bg-secondary", text: "text-white", label: "Foursomes Set", icon: CheckIcon },
  scheduled: { bg: "bg-neutral-400", text: "text-white", label: "Scheduled", icon: CalendarIcon },
};

export function DashboardRoundCard({
  round,
  availability,
  declarations,
  canEnterScore,
  foursomes,
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
          <span className={`inline-flex items-center gap-1 ${badgeStyle.bg} ${badgeStyle.text} text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap`}>
            <Icon icon={badgeStyle.icon} size="sm" />
            {badgeStyle.label}
          </span>
          {availability && !roundEnded && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                availability.status === "in"
                  ? "bg-success text-white"
                  : availability.status === "out"
                  ? "bg-danger text-white"
                  : "bg-warning text-neutral-900"
              }`}
            >
              {availability.status === "in" ? (
                <>
                  <Icon icon={CheckIcon} size="sm" />
                  In
                </>
              ) : availability.status === "out" ? (
                <>
                  <Icon icon={XMarkIcon} size="sm" />
                  Out
                </>
              ) : (
                <>
                  <Icon icon={ExclamationTriangleIcon} size="sm" />
                  Undeclared
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Declaration Status */}
      {!roundEnded &&
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
                        className="inline-flex items-center gap-1 bg-success text-white text-xs px-2 py-1 rounded"
                      >
                        <Icon icon={CheckIcon} size="sm" />
                        T{team.teamNumber}: {team.golferName}
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
                        className="inline-flex items-center gap-1 bg-danger text-white text-xs px-2 py-1 rounded"
                      >
                        <Icon icon={XMarkIcon} size="sm" />
                        T{team.teamNumber}: {team.teamName}
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
        {availability && !roundEnded && availability.status === "undeclared" && (
          <Button variant="secondary" asChild className="flex-1">
            <Link href={`/availability/${round.id}`}>
              Declare Availability
            </Link>
          </Button>
        )}
        {availability && !roundEnded && (availability.status === "in" || availability.status === "out") && (
          <Button variant="ghost" asChild className="flex-1">
            <Link href={`/availability/${round.id}`}>
              Change Availability
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

      {/* Foursomes */}
      {foursomes && foursomes.length > 0 && (
        <div className="mt-md pt-md border-t border-neutral-100">
          <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-md">Foursomes</p>
          <div className="space-y-md">
            {foursomes.map((foursome: any) => {
              const cart1 = foursome.members.filter((m: any) => m.cart_number === 1)
              const cart2 = foursome.members.filter((m: any) => m.cart_number === 2)
              return (
                <div key={foursome.id}>
                  <p className="text-xs font-medium text-neutral-600 mb-xs">Tee Time Slot {foursome.tee_time_slot}</p>
                  <div className="grid grid-cols-2 gap-xs">
                    <div className="bg-neutral-50 rounded p-xs border border-neutral-100">
                      <p className="text-xs font-semibold text-neutral-600 mb-1">Cart 1</p>
                      {cart1.map((m: any) => (
                        <div key={m.user_id ?? m.sub?.id} className="text-sm leading-snug">
                          <span className="font-medium">{getMemberName(m)}</span>
                          <span className="text-xs text-neutral-500 ml-1">T{m.team?.team_number}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-neutral-50 rounded p-xs border border-neutral-100">
                      <p className="text-xs font-semibold text-neutral-600 mb-1">Cart 2</p>
                      {cart2.map((m: any) => (
                        <div key={m.user_id ?? m.sub?.id} className="text-sm leading-snug">
                          <span className="font-medium">{getMemberName(m)}</span>
                          <span className="text-xs text-neutral-500 ml-1">T{m.team?.team_number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
