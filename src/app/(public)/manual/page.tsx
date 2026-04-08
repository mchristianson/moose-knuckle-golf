import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { FlagIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export const metadata = {
  title: 'User Manual | Moose Knuckle Golf League',
}

export default function UserManualPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-10 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Icon icon={FlagIcon} size="lg" className="text-green-500" />
          <div>
            <h1 className="text-3xl font-bold text-green-400">Player Manual</h1>
            <p className="text-zinc-500 text-sm">Moose Knuckle Golf League</p>
          </div>
        </div>
        <p className="text-zinc-300 mt-4 text-base">
          Welcome to the Moose Knuckle Golf League. This guide walks you through everything
          you need to know as a player — from checking the standings to entering your scores.
        </p>
        <p className="text-sm text-zinc-500 mt-2">
          Looking for admin docs?{' '}
          <Link href="/admin-manual" className="text-green-400 underline hover:text-green-300">
            View the Admin Manual →
          </Link>
        </p>
      </div>

      {/* Table of Contents */}
      <div className="mb-10 bg-zinc-800/60 rounded-xl p-5 border border-zinc-700">
        <h2 className="font-semibold text-zinc-300 mb-3 text-sm uppercase tracking-wide">In This Guide</h2>
        <ol className="space-y-1.5 text-sm">
          <li><a href="#overview" className="text-green-400 hover:underline">1. How the League Works</a></li>
          <li><a href="#leaderboard" className="text-green-400 hover:underline">2. Leaderboard &amp; Standings</a></li>
          <li><a href="#login" className="text-green-400 hover:underline">3. Logging In</a></li>
          <li><a href="#dashboard" className="text-green-400 hover:underline">4. Your Dashboard</a></li>
          <li><a href="#availability" className="text-green-400 hover:underline">5. Declaring Availability</a></li>
          <li><a href="#declaring" className="text-green-400 hover:underline">6. Declaring Your Golfer</a></li>
          <li><a href="#foursomes" className="text-green-400 hover:underline">7. Viewing Foursomes</a></li>
          <li><a href="#scoring" className="text-green-400 hover:underline">8. Entering Your Score</a></li>
        </ol>
      </div>

      {/* Section 1: Overview */}
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <Icon icon={TrophyIcon} size="md" className="text-green-400" />
          How the League Works
        </h2>
        <p className="text-zinc-300 mb-4">
          The Moose Knuckle Golf League is organized into <strong className="text-white">teams of 1–2 players</strong>. Each round,
          one golfer per team plays and earns points based on their net score (gross score minus handicap).
          Points accumulate across all rounds to determine the season champion.
        </p>
        <div className="bg-green-900/25 border border-green-800/50 rounded-xl p-5 mb-4">
          <h3 className="font-semibold text-green-300 mb-2">Key Concepts</h3>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li><strong className="text-white">Teams</strong> — You belong to a team. Each round, one team member declares they are playing.</li>
            <li><strong className="text-white">Availability</strong> — Before each round, you tell the league if you're "In" or "Out".</li>
            <li><strong className="text-white">Declaration</strong> — Your team picks which member will play that round.</li>
            <li><strong className="text-white">Foursomes</strong> — The 8 declared golfers are split into two groups of 4 with tee times.</li>
            <li><strong className="text-white">Net Score</strong> — Your gross score minus your handicap. Lower is better.</li>
            <li><strong className="text-white">Points</strong> — Awarded by finish position each round. Points accumulate for the season leaderboard.</li>
          </ul>
        </div>
        <div className="bg-blue-900/25 border border-blue-800/50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-300 mb-2">Round Lifecycle</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { label: 'Scheduled', desc: 'Round is created' },
              { label: 'Availability Open', desc: 'Declare In/Out' },
              { label: 'Foursomes Set', desc: 'Groups are assigned' },
              { label: 'In Progress', desc: 'Round is being played' },
              { label: 'Scoring', desc: 'Enter your scores' },
              { label: 'Completed', desc: 'Points awarded' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-1">
                {i > 0 && <span className="text-blue-600">→</span>}
                <span className="bg-blue-900/50 text-blue-200 border border-blue-800/50 px-2 py-1 rounded font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Leaderboard */}
      <section id="leaderboard" className="mb-12">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <Icon icon={ChartBarIcon} size="md" className="text-green-400" />
          Leaderboard &amp; Standings
        </h2>
        <p className="text-zinc-300 mb-4">
          The <Link href="/leaderboard" className="text-green-400 underline">Leaderboard</Link> is the
          public home page — no login required. It shows you everything happening in the current season.
        </p>
        <div className="border border-zinc-700 rounded-xl overflow-hidden mb-4">
          <div className="bg-zinc-700/60 px-4 py-2 border-b border-zinc-700">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Leaderboard Tabs</p>
          </div>
          <div className="divide-y divide-zinc-700/60 text-sm">
            <div className="px-4 py-3">
              <span className="font-medium text-green-400">Season Standings</span>
              <p className="text-zinc-400 text-xs mt-0.5">Team rankings by total points for the year, with rounds played and average score.</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-green-400">Recent Rounds</span>
              <p className="text-zinc-400 text-xs mt-0.5">Results from the last 5 completed rounds — who played, their net score, and points earned.</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-green-400">Current Round</span>
              <p className="text-zinc-400 text-xs mt-0.5">Live scores as they come in during an active round.</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-green-400">Next Round</span>
              <p className="text-zinc-400 text-xs mt-0.5">Upcoming round availability summary and foursomes once assigned.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Login */}
      <section id="login" className="mb-12">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>🔑</span> Logging In
        </h2>
        <p className="text-zinc-300 mb-4">
          Click the <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full">Login</span> button
          in the top-right navigation to reach the login page. You can sign in with your phone number
          or use your Google account.
        </p>
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200 mb-2">Sign-in options:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong className="text-white">Phone (SMS)</strong> — enter your number, receive a verification code</li>
            <li><strong className="text-white">Google Sign-In</strong> — one-click login with your Google account</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Don't have an account yet? Your league admin will set you up. You can also register at <code className="bg-zinc-700 px-1 rounded text-zinc-300">/register</code>.
          </p>
        </div>
      </section>

      {/* Section 4: Dashboard */}
      <section id="dashboard" className="mb-12">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>🏠</span> Your Dashboard
        </h2>
        <p className="text-zinc-300 mb-4">
          After logging in, the <Link href="/dashboard" className="text-green-400 underline">Dashboard</Link> is
          your personal hub. It shows all upcoming rounds and what action — if any — is needed from you.
        </p>
        <div className="border border-zinc-700 rounded-xl overflow-hidden mb-4">
          <div className="bg-zinc-700/60 px-4 py-2 border-b border-zinc-700">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Dashboard Sections</p>
          </div>
          <div className="divide-y divide-zinc-700/60 text-sm">
            <div className="px-4 py-3 flex gap-3">
              <span className="text-lg">🎯</span>
              <div>
                <span className="font-medium text-zinc-100">Score Entry Open</span>
                <p className="text-zinc-400 text-xs mt-0.5">Appears when a round is active and you are in a foursome. You can enter scores for yourself and your foursome-mates.</p>
              </div>
            </div>
            <div className="px-4 py-3 flex gap-3">
              <span className="text-lg">📅</span>
              <div>
                <span className="font-medium text-zinc-100">Upcoming Rounds</span>
                <p className="text-zinc-400 text-xs mt-0.5">List of the next rounds with status, your availability, and action buttons.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/25 border border-yellow-800/50 rounded-xl p-4 text-sm">
          <p className="font-semibold text-yellow-300 mb-1">Action buttons on the Dashboard</p>
          <ul className="space-y-1 text-yellow-200">
            <li>• <strong>Declare Availability</strong> — shown when availability is open and you haven't responded yet</li>
            <li>• <strong>Declare Golfers</strong> — shown when your team needs to pick who is playing</li>
            <li>• <strong>Enter My Score</strong> — shown when scoring is open and you're in a foursome</li>
          </ul>
        </div>
      </section>

      {/* Section 5: Availability */}
      <section id="availability" className="mb-12">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>✅</span> Declaring Availability
        </h2>
        <p className="text-zinc-300 mb-4">
          When availability opens for a round, the Dashboard will show a <strong className="text-white">"Declare Availability"</strong> button.
          Click it to go to the availability page for that round.
        </p>
        <div className="border border-zinc-700 rounded-xl p-5 mb-4 bg-zinc-800/40">
          <h3 className="font-semibold text-zinc-200 mb-3">Your options:</h3>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[100px] border-2 border-green-600 rounded-xl p-3 text-center bg-green-900/25">
              <p className="font-bold text-green-400 text-lg">In</p>
              <p className="text-xs text-zinc-400 mt-1">You plan to play this round</p>
            </div>
            <div className="flex-1 min-w-[100px] border-2 border-red-600 rounded-xl p-3 text-center bg-red-900/25">
              <p className="font-bold text-red-400 text-lg">Out</p>
              <p className="text-xs text-zinc-400 mt-1">You cannot play this round</p>
            </div>
            <div className="flex-1 min-w-[100px] border-2 border-zinc-600 rounded-xl p-3 text-center bg-zinc-700/30">
              <p className="font-bold text-zinc-400 text-lg">Undeclared</p>
              <p className="text-xs text-zinc-500 mt-1">Clear your response</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-900/25 border border-blue-800/50 rounded-xl p-4 text-sm text-blue-200">
          <strong className="text-blue-300">Team rule:</strong> For a two-person team, only one member needs to declare availability.
          The page also shows your teammate's current status.
        </div>
      </section>

      {/* Section 6: Declaring Golfer */}
      <section id="declaring" className="mb-12">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>👤</span> Declaring Your Golfer
        </h2>
        <p className="text-zinc-300 mb-4">
          Once availability is set and the admin moves the round forward, your team needs to declare
          <strong className="text-white"> which member</strong> will play. This is done from the Dashboard via the
          <strong className="text-white"> "Declare Golfers"</strong> button.
        </p>
        <div className="border border-zinc-700 rounded-xl p-4 bg-zinc-800/40 text-sm">
          <p className="text-zinc-300 mb-2">On the declaration page you will see:</p>
          <ul className="space-y-2 text-zinc-400 list-disc list-inside">
            <li>A dropdown for your team to select which member is playing</li>
            <li>Status badges showing which teams have already declared</li>
            <li>The round date and number for reference</li>
          </ul>
        </div>
        <div className="bg-yellow-900/25 border border-yellow-800/50 rounded-xl p-4 text-sm mt-4 text-yellow-200">
          You can only edit your own team's declaration. Other teams' selections are read-only.
        </div>
      </section>

      {/* Section 7: Foursomes */}
      <section id="foursomes" className="mb-12">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>🚗</span> Viewing Foursomes
        </h2>
        <p className="text-zinc-300 mb-4">
          Once the admin generates foursomes, you can see your group assignment from the{' '}
          <Link href="/leaderboard" className="text-green-400 underline">Leaderboard</Link>
          {' '}(Next Round tab) or by following the foursomes link for that round.
        </p>
        <div className="border border-zinc-700 rounded-xl overflow-hidden">
          <div className="bg-zinc-700/60 px-4 py-2 border-b border-zinc-700">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Foursome Details</p>
          </div>
          <div className="divide-y divide-zinc-700/60 text-sm">
            <div className="px-4 py-3">
              <span className="font-medium text-zinc-100">Two groups of 4</span>
              <p className="text-zinc-400 text-xs mt-0.5">The 8 declared golfers are split into two foursomes. Each group has a tee time (Slot 1 or Slot 2).</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-zinc-100">Carts</span>
              <p className="text-zinc-400 text-xs mt-0.5">Within each foursome, players are paired into 2 carts of 2.</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-zinc-100">Substitutes</span>
              <p className="text-zinc-400 text-xs mt-0.5">If a team uses a substitute golfer, they will appear in the foursome labeled as a sub.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Scoring */}
      <section id="scoring" className="mb-12">
        <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
          <span>🖊️</span> Entering Scores
        </h2>
        <p className="text-zinc-300 mb-4">
          After the round, the admin opens scoring. Your Dashboard will show an <strong className="text-white">"Enter My Score"</strong> button
          if you are in a foursome for that round. The score entry page shows <strong className="text-white">all four players in your foursome</strong> —
          you can enter or update scores for any of them, not just yourself.
        </p>

        <div className="border border-zinc-700 rounded-xl overflow-hidden mb-4">
          <div className="bg-zinc-700/60 px-4 py-2 border-b border-zinc-700">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Switching Between Players</p>
          </div>
          <div className="px-4 py-4 text-sm text-zinc-300">
            <p className="mb-3">
              At the top of the score entry page, a row of buttons shows each player in your foursome.
              Your own name is marked <span className="text-zinc-500 text-xs font-medium">(me)</span>.
              Click any player's button to load their scorecard.
            </p>
            <div className="flex gap-1 text-xs font-medium flex-wrap">
              <span className="bg-green-700 text-white px-3 py-1.5 rounded-l-lg">Matty Ice <span className="text-green-200">(me)</span></span>
              <span className="-ml-px bg-zinc-800 border border-zinc-600 text-zinc-200 px-3 py-1.5">Skinny</span>
              <span className="-ml-px bg-zinc-800 border border-zinc-600 text-zinc-200 px-3 py-1.5">Grimmie</span>
              <span className="-ml-px bg-zinc-800 border border-zinc-600 text-zinc-200 px-3 py-1.5 rounded-r-lg">Erin 🔒</span>
            </div>
            <p className="text-zinc-500 text-xs mt-3">
              A <strong className="text-zinc-400">🔒</strong> next to a name means that player's score has been locked and cannot be edited.
            </p>
          </div>
        </div>

        <div className="border border-zinc-700 rounded-xl p-5 bg-zinc-800/40 mb-4">
          <h3 className="font-semibold text-zinc-200 mb-3">The Scorecard</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-700/50 rounded-xl p-3">
              <p className="font-medium text-zinc-200">9 Holes</p>
              <p className="text-zinc-400 text-xs mt-1">Enter the gross score for each hole (1–9).</p>
            </div>
            <div className="bg-zinc-700/50 rounded-xl p-3">
              <p className="font-medium text-zinc-200">Handicap</p>
              <p className="text-zinc-400 text-xs mt-1">Shown automatically — set by the admin for each player.</p>
            </div>
            <div className="bg-zinc-700/50 rounded-xl p-3">
              <p className="font-medium text-zinc-200">Gross Score</p>
              <p className="text-zinc-400 text-xs mt-1">Total of all 9 holes (calculated automatically).</p>
            </div>
            <div className="bg-zinc-700/50 rounded-xl p-3">
              <p className="font-medium text-zinc-200">Net Score</p>
              <p className="text-zinc-400 text-xs mt-1">Gross minus handicap — this determines finish position and points.</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/25 border border-blue-800/50 rounded-xl p-4 text-sm mb-4">
          <p className="font-semibold text-blue-300 mb-1">External subs</p>
          <p className="text-blue-200">If a foursome includes an external substitute who doesn't have a league account,
          only an admin can enter their score.</p>
        </div>

        <div className="bg-green-900/25 border border-green-800/50 rounded-xl p-4 text-sm">
          <p className="font-semibold text-green-300 mb-1">After scores are submitted</p>
          <p className="text-green-200">Once the admin closes scoring and finalizes the round, points are calculated
          and the season leaderboard updates automatically.</p>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-zinc-800 pt-6 mt-4 text-sm text-zinc-500">
        <p>Need to manage the league? <Link href="/admin-manual" className="text-green-400 underline">View the Admin Manual →</Link></p>
        <p className="mt-1"><Link href="/leaderboard" className="text-green-400 underline">← Back to Leaderboard</Link></p>
      </div>
    </div>
  )
}
