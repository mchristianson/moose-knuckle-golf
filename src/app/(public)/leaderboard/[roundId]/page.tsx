import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRoundScores } from '@/lib/data/round-scores'
import { RoundScorecard } from '@/components/leaderboard/RoundScorecard'
import { Icon } from '@/components/Icon'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

interface Props {
  params: Promise<{ roundId: string }>
}

export default async function RoundDetailPage({ params }: Props) {
  const { roundId } = await params
  const { round, scores } = await getRoundScores(roundId)

  if (!round) notFound()

  const isCompleted = round.status === 'completed'

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Back nav */}
      <div className="px-4 pt-3 pb-2">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <Icon icon={ChevronLeftIcon} size="sm" />
          Leaderboard
        </Link>
      </div>

      {/* Title */}
      <div className="px-4 pb-4">
        <h1 className="text-3xl font-bold text-white">Round {round.round_number}</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          {isCompleted ? 'Final Results' : 'Round in Progress'}
        </p>
      </div>

      <RoundScorecard round={round} scores={scores} showScoreButton={false} />
    </div>
  )
}
