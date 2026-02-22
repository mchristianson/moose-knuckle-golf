import Link from 'next/link'

export const metadata = {
  title: 'User Manual | Moose Knuckle Golf League',
}

export default function UserManualPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-10 border-b pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">⛳</span>
          <div>
            <h1 className="text-3xl font-bold text-green-800">Player Manual</h1>
            <p className="text-gray-500 text-sm">Moose Knuckle Golf League</p>
          </div>
        </div>
        <p className="text-gray-600 mt-4 text-base">
          Welcome to the Moose Knuckle Golf League. This guide walks you through everything
          you need to know as a player — from checking the standings to entering your scores.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Looking for admin docs? <Link href="/admin-manual" className="text-green-700 underline hover:text-green-900">View the Admin Manual →</Link>
        </p>
      </div>

      {/* Table of Contents */}
      <div className="mb-10 bg-gray-50 rounded-lg p-5 border">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">In This Guide</h2>
        <ol className="space-y-1.5 text-sm">
          <li><a href="#overview" className="text-green-700 hover:underline">1. How the League Works</a></li>
          <li><a href="#leaderboard" className="text-green-700 hover:underline">2. Leaderboard & Standings</a></li>
          <li><a href="#login" className="text-green-700 hover:underline">3. Logging In</a></li>
          <li><a href="#dashboard" className="text-green-700 hover:underline">4. Your Dashboard</a></li>
          <li><a href="#availability" className="text-green-700 hover:underline">5. Declaring Availability</a></li>
          <li><a href="#declaring" className="text-green-700 hover:underline">6. Declaring Your Golfer</a></li>
          <li><a href="#foursomes" className="text-green-700 hover:underline">7. Viewing Foursomes</a></li>
          <li><a href="#scoring" className="text-green-700 hover:underline">8. Entering Your Score</a></li>
        </ol>
      </div>

      {/* Section 1: Overview */}
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🏆</span> How the League Works
        </h2>
        <p className="text-gray-700 mb-4">
          The Moose Knuckle Golf League is organized into <strong>teams of 1–2 players</strong>. Each round,
          one golfer per team plays and earns points based on their net score (gross score minus handicap).
          Points accumulate across all rounds to determine the season champion.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-4">
          <h3 className="font-semibold text-green-800 mb-2">Key Concepts</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><strong>Teams</strong> — You belong to a team. Each round, one team member declares they are playing.</li>
            <li><strong>Availability</strong> — Before each round, you tell the league if you're "In" or "Out".</li>
            <li><strong>Declaration</strong> — Your team picks which member will play that round.</li>
            <li><strong>Foursomes</strong> — The 8 declared golfers are split into two groups of 4 with tee times.</li>
            <li><strong>Net Score</strong> — Your gross score minus your handicap. Lower is better.</li>
            <li><strong>Points</strong> — Awarded by finish position each round. Points accumulate for the season leaderboard.</li>
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Round Lifecycle</h3>
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
                {i > 0 && <span className="text-blue-300">→</span>}
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Leaderboard */}
      <section id="leaderboard" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>📊</span> Leaderboard & Standings
        </h2>
        <p className="text-gray-700 mb-4">
          The <Link href="/leaderboard" className="text-green-700 underline">Leaderboard</Link> is the
          public home page — no login required. It shows you everything happening in the current season.
        </p>
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Leaderboard Tabs</p>
          </div>
          <div className="divide-y text-sm">
            <div className="px-4 py-3">
              <span className="font-medium text-green-700">Season Standings</span>
              <p className="text-gray-600 text-xs mt-0.5">Team rankings by total points for the year, with rounds played and average score.</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-green-700">Recent Rounds</span>
              <p className="text-gray-600 text-xs mt-0.5">Results from the last 5 completed rounds — who played, their net score, and points earned.</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-green-700">Current Round</span>
              <p className="text-gray-600 text-xs mt-0.5">Live scores as they come in during an active round.</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium text-green-700">Next Round</span>
              <p className="text-gray-600 text-xs mt-0.5">Upcoming round availability summary and foursomes once assigned.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Login */}
      <section id="login" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🔑</span> Logging In
        </h2>
        <p className="text-gray-700 mb-4">
          Click the <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full">Login</span> button
          in the top-right navigation to reach the login page. You can sign in with your email and password
          or use your Google account.
        </p>
        <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-2">Sign-in options:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Email + Password</strong> — enter your registered email and password</li>
            <li><strong>Google Sign-In</strong> — one-click login with your Google account</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            Don't have an account yet? Your league admin will set you up. You can also register at <code>/register</code>.
          </p>
        </div>
      </section>

      {/* Section 4: Dashboard */}
      <section id="dashboard" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🏠</span> Your Dashboard
        </h2>
        <p className="text-gray-700 mb-4">
          After logging in, the <Link href="/dashboard" className="text-green-700 underline">Dashboard</Link> is
          your personal hub. It shows all upcoming rounds and what action — if any — is needed from you.
        </p>
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dashboard Sections</p>
          </div>
          <div className="divide-y text-sm">
            <div className="px-4 py-3 flex gap-3">
              <span className="text-lg">🎯</span>
              <div>
                <span className="font-medium">Score Entry Open</span>
                <p className="text-gray-600 text-xs mt-0.5">Appears when a round is active and your scores are ready to enter.</p>
              </div>
            </div>
            <div className="px-4 py-3 flex gap-3">
              <span className="text-lg">📅</span>
              <div>
                <span className="font-medium">Upcoming Rounds</span>
                <p className="text-gray-600 text-xs mt-0.5">List of the next rounds with status, your availability, and action buttons.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-yellow-800 mb-1">Action buttons on the Dashboard</p>
          <ul className="space-y-1 text-yellow-900">
            <li>• <strong>Declare Availability</strong> — shown when availability is open and you haven't responded yet</li>
            <li>• <strong>Declare Golfers</strong> — shown when your team needs to pick who is playing</li>
            <li>• <strong>Enter My Score</strong> — shown when scoring is open and you're in a foursome</li>
          </ul>
        </div>
      </section>

      {/* Section 5: Availability */}
      <section id="availability" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>✅</span> Declaring Availability
        </h2>
        <p className="text-gray-700 mb-4">
          When availability opens for a round, the Dashboard will show a <strong>"Declare Availability"</strong> button.
          Click it to go to the availability page for that round.
        </p>
        <div className="border rounded-lg p-5 mb-4 bg-white">
          <h3 className="font-semibold text-gray-800 mb-3">Your options:</h3>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[100px] border-2 border-green-500 rounded-lg p-3 text-center bg-green-50">
              <p className="font-bold text-green-700 text-lg">In</p>
              <p className="text-xs text-gray-600 mt-1">You plan to play this round</p>
            </div>
            <div className="flex-1 min-w-[100px] border-2 border-red-400 rounded-lg p-3 text-center bg-red-50">
              <p className="font-bold text-red-600 text-lg">Out</p>
              <p className="text-xs text-gray-600 mt-1">You cannot play this round</p>
            </div>
            <div className="flex-1 min-w-[100px] border-2 border-gray-300 rounded-lg p-3 text-center bg-gray-50">
              <p className="font-bold text-gray-500 text-lg">Undeclared</p>
              <p className="text-xs text-gray-600 mt-1">Clear your response</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Team rule:</strong> For a two-person team, only one member needs to declare availability.
          The page also shows your teammate's current status.
        </div>
      </section>

      {/* Section 6: Declaring Golfer */}
      <section id="declaring" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>👤</span> Declaring Your Golfer
        </h2>
        <p className="text-gray-700 mb-4">
          Once availability is set and the admin moves the round forward, your team needs to declare
          <strong> which member</strong> will play. This is done from the Dashboard via the
          <strong> "Declare Golfers"</strong> button.
        </p>
        <div className="border rounded-lg p-4 bg-white text-sm">
          <p className="text-gray-700 mb-2">On the declaration page you will see:</p>
          <ul className="space-y-2 text-gray-600 list-disc list-inside">
            <li>A dropdown for your team to select which member is playing</li>
            <li>Status badges showing which teams have already declared</li>
            <li>The round date and number for reference</li>
          </ul>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm mt-4 text-yellow-900">
          You can only edit your own team's declaration. Other teams' selections are read-only.
        </div>
      </section>

      {/* Section 7: Foursomes */}
      <section id="foursomes" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🚗</span> Viewing Foursomes
        </h2>
        <p className="text-gray-700 mb-4">
          Once the admin generates foursomes, you can see your group assignment from the
          <Link href="/leaderboard" className="text-green-700 underline mx-1">Leaderboard</Link>
          (Next Round tab) or by following the foursomes link for that round.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Foursome Details</p>
          </div>
          <div className="divide-y text-sm">
            <div className="px-4 py-3">
              <span className="font-medium">Two groups of 4</span>
              <p className="text-gray-600 text-xs mt-0.5">The 8 declared golfers are split into two foursomes. Each group has a tee time (Slot 1 or Slot 2).</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium">Carts</span>
              <p className="text-gray-600 text-xs mt-0.5">Within each foursome, players are paired into 2 carts of 2.</p>
            </div>
            <div className="px-4 py-3">
              <span className="font-medium">Substitutes</span>
              <p className="text-gray-600 text-xs mt-0.5">If a team uses a substitute golfer, they will appear in the foursome labeled as a sub.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Scoring */}
      <section id="scoring" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🖊️</span> Entering Your Score
        </h2>
        <p className="text-gray-700 mb-4">
          After the round, the admin opens scoring. Your Dashboard will show an <strong>"Enter My Score"</strong> button.
          You can only enter scores if you were the declared golfer for your team in that round.
        </p>
        <div className="border rounded-lg p-5 bg-white mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">The Score Entry Form</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700">9 Holes</p>
              <p className="text-gray-500 text-xs mt-1">Enter your gross score for each hole (1–9).</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700">Handicap</p>
              <p className="text-gray-500 text-xs mt-1">Shown automatically — set by your admin.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700">Gross Score</p>
              <p className="text-gray-500 text-xs mt-1">Total of all 9 holes (calculated automatically).</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700">Net Score</p>
              <p className="text-gray-500 text-xs mt-1">Gross minus handicap — this is what determines your finish position.</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-green-800 mb-1">After submitting scores</p>
          <p className="text-green-900">Once the admin closes scoring and finalizes the round, points are calculated
          and the season leaderboard updates automatically.</p>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t pt-6 mt-4 text-sm text-gray-500">
        <p>Need to manage the league? <Link href="/admin-manual" className="text-green-700 underline">View the Admin Manual →</Link></p>
        <p className="mt-1"><Link href="/leaderboard" className="text-green-700 underline">← Back to Leaderboard</Link></p>
      </div>
    </div>
  )
}
