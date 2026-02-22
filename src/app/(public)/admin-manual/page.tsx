import Link from 'next/link'

export const metadata = {
  title: 'Admin Manual | Moose Knuckle Golf League',
}

export default function AdminManualPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-10 border-b pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">📋</span>
          <div>
            <h1 className="text-3xl font-bold text-green-800">Admin Manual</h1>
            <p className="text-gray-500 text-sm">Moose Knuckle Golf League — League Administration</p>
          </div>
        </div>
        <p className="text-gray-600 mt-4 text-base">
          This guide covers everything an admin needs to set up and run a season — from creating teams
          and scheduling rounds to generating foursomes and finalizing scores.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Looking for player docs? <Link href="/manual" className="text-green-700 underline hover:text-green-900">View the Player Manual →</Link>
        </p>
      </div>

      {/* Table of Contents */}
      <div className="mb-10 bg-gray-50 rounded-lg p-5 border">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">In This Guide</h2>
        <ol className="space-y-1.5 text-sm">
          <li><a href="#access" className="text-green-700 hover:underline">1. Accessing the Admin Panel</a></li>
          <li><a href="#setup" className="text-green-700 hover:underline">2. Season Setup</a></li>
          <li><a href="#users" className="text-green-700 hover:underline">3. Managing Users</a></li>
          <li><a href="#teams" className="text-green-700 hover:underline">4. Managing Teams</a></li>
          <li><a href="#handicaps" className="text-green-700 hover:underline">5. Setting Handicaps</a></li>
          <li><a href="#subs" className="text-green-700 hover:underline">6. Managing Substitutes</a></li>
          <li><a href="#rounds" className="text-green-700 hover:underline">7. Running a Round</a></li>
          <li><a href="#foursomes" className="text-green-700 hover:underline">8. Generating & Editing Foursomes</a></li>
          <li><a href="#scoring" className="text-green-700 hover:underline">9. Managing Scores & Finalizing</a></li>
          <li><a href="#audit" className="text-green-700 hover:underline">10. Audit Log</a></li>
        </ol>
      </div>

      {/* Section 1: Accessing Admin */}
      <section id="access" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🔐</span> Accessing the Admin Panel
        </h2>
        <p className="text-gray-700 mb-4">
          Admin access is granted per-user. Once your account has the admin flag enabled,
          an <strong>"Admin"</strong> link appears in the site navigation after you log in.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-green-700 text-white px-4 py-2 flex items-center justify-between text-sm">
            <span className="font-bold">Moose Knuckle Golf</span>
            <div className="flex gap-4 text-green-200 text-xs">
              <span>Public View</span>
              <span>Dashboard</span>
              <span>Sign Out</span>
            </div>
          </div>
          <div className="p-4 flex gap-2">
            <aside className="w-40 bg-gray-50 border rounded p-2 text-xs space-y-1">
              <div className="bg-green-100 text-green-900 px-2 py-1 rounded font-medium">📊 Dashboard</div>
              <div className="text-gray-600 px-2 py-1">⛳ Teams</div>
              <div className="text-gray-600 px-2 py-1">📅 Rounds</div>
              <div className="text-gray-600 px-2 py-1">🎯 Handicaps</div>
              <div className="text-gray-600 px-2 py-1">👥 Subs</div>
              <div className="text-gray-600 px-2 py-1">👤 Users</div>
              <div className="text-gray-600 px-2 py-1">📝 Audit Log</div>
            </aside>
            <div className="flex-1 bg-gray-50 border rounded p-3 text-xs text-gray-500 flex items-center justify-center">
              Admin content area
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          The admin panel has a green header and a left sidebar with links to all admin sections.
        </p>
      </section>

      {/* Section 2: Season Setup */}
      <section id="setup" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🚀</span> Season Setup
        </h2>
        <p className="text-gray-700 mb-4">
          At the start of a new season, follow this order to get everything configured:
        </p>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Add Users', desc: 'Ensure all players have accounts. Grant admin flag to anyone who needs it.' },
            { step: '2', title: 'Create Teams', desc: 'Build teams of 1–2 players. Assign members from the user list.' },
            { step: '3', title: 'Set Handicaps', desc: 'Enter each player\'s handicap. This affects net score calculations all season.' },
            { step: '4', title: 'Add Substitute Pool', desc: 'Add golfers who can fill in but aren\'t full members of a team.' },
            { step: '5', title: 'Schedule Rounds', desc: 'Create rounds with dates, tee times, and round numbers.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start bg-white border rounded-lg p-4">
              <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{item.title}</p>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Users */}
      <section id="users" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>👤</span> Managing Users
        </h2>
        <p className="text-gray-700 mb-4">
          Go to <strong>Admin → Users</strong> to view and manage all registered accounts.
        </p>
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">User List</p>
          </div>
          <div className="divide-y text-sm">
            <div className="px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">Jane Smith <span className="text-xs text-green-600 font-medium ml-2 bg-green-50 px-1.5 py-0.5 rounded">Admin</span></p>
                <p className="text-gray-500 text-xs">jane@example.com · Active</p>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="bg-gray-100 text-gray-700 px-2 py-1 rounded">Edit</button>
                <button className="bg-red-50 text-red-600 px-2 py-1 rounded">Deactivate</button>
              </div>
            </div>
            <div className="px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">Bob Jones</p>
                <p className="text-gray-500 text-xs">bob@example.com · Active</p>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="bg-gray-100 text-gray-700 px-2 py-1 rounded">Edit</button>
                <button className="bg-green-50 text-green-700 px-2 py-1 rounded">Make Admin</button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
          <strong>Admin flag:</strong> Toggling a user's admin status takes effect immediately.
          Admins have full access to the admin panel and can manage all league data.
        </div>
      </section>

      {/* Section 4: Teams */}
      <section id="teams" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>⛳</span> Managing Teams
        </h2>
        <p className="text-gray-700 mb-4">
          Go to <strong>Admin → Teams</strong> to create and manage teams. The league supports up to 8 teams per season.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border rounded-lg p-4 bg-white text-sm">
            <p className="font-semibold text-gray-800 mb-1">Creating a Team</p>
            <ol className="text-gray-600 space-y-1 list-decimal list-inside text-xs">
              <li>Click "New Team"</li>
              <li>Enter a team name and number</li>
              <li>Save the team</li>
              <li>Add 1–2 members from the user list</li>
            </ol>
          </div>
          <div className="border rounded-lg p-4 bg-white text-sm">
            <p className="font-semibold text-gray-800 mb-1">Team Cards</p>
            <p className="text-gray-600 text-xs">
              Each team card shows the team name, number, and its members. You can add or remove members from the card view.
            </p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          Teams are seasonal. Each season uses 8 teams of 1–2 players. Foursomes are generated from
          the 8 declared golfers per round — one per team.
        </div>
      </section>

      {/* Section 5: Handicaps */}
      <section id="handicaps" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🎯</span> Setting Handicaps
        </h2>
        <p className="text-gray-700 mb-4">
          Go to <strong>Admin → Handicaps</strong> to set or update each player's handicap.
          The handicap is subtracted from the gross score to produce the net score used for standings.
        </p>
        <div className="border rounded-lg p-4 bg-white text-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-gray-700">Player Handicaps</p>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { name: 'Jane Smith', hcp: 8 },
              { name: 'Bob Jones', hcp: 14 },
              { name: 'Tom Miller', hcp: 5 },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between border-b pb-2">
                <span className="text-gray-700">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-mono">HCP: {p.hcp}</span>
                  <button className="text-xs text-green-700 underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
          Handicaps are stored per-player and are snapshot at score entry time. Updating a handicap
          does not retroactively change completed round scores.
        </div>
      </section>

      {/* Section 6: Subs */}
      <section id="subs" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>👥</span> Managing Substitutes
        </h2>
        <p className="text-gray-700 mb-4">
          Go to <strong>Admin → Subs</strong> to manage the substitute player pool. Subs can fill in
          for teams when a regular player is unable to play.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border rounded-lg p-4 bg-white text-sm">
            <p className="font-semibold text-gray-800 mb-2">Sub Pool</p>
            <p className="text-gray-600 text-xs">A roster of available substitute golfers with their names and contact info. Add subs via "New Sub".</p>
          </div>
          <div className="border rounded-lg p-4 bg-white text-sm">
            <p className="font-semibold text-gray-800 mb-2">Sub Requests</p>
            <p className="text-gray-600 text-xs">Pending requests to assign a sub to a round. Approve or reject from the Subs page.</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          When a sub plays, they appear in the foursome under the team they are substituting for.
          Their score counts for that team's round result.
        </div>
      </section>

      {/* Section 7: Running a Round */}
      <section id="rounds" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>📅</span> Running a Round
        </h2>
        <p className="text-gray-700 mb-4">
          Each round moves through a lifecycle. Go to <strong>Admin → Rounds</strong> to manage rounds.
        </p>

        {/* Lifecycle */}
        <div className="mb-6 space-y-3">
          {[
            {
              status: 'Scheduled',
              color: 'gray',
              action: 'Create the round',
              details: 'Set the round number, date, and tee time. The round is visible but availability is not yet open.',
            },
            {
              status: 'Availability Open',
              color: 'yellow',
              action: 'Open availability',
              details: 'Players can now declare "In" or "Out". Teams can also declare which member will play.',
            },
            {
              status: 'Foursomes Set',
              color: 'blue',
              action: 'Generate foursomes',
              details: 'Generate and review the two groups of 4. Edit assignments as needed before play begins.',
            },
            {
              status: 'In Progress',
              color: 'orange',
              action: 'Start the round',
              details: 'Round is being played. Live scores become visible on the public leaderboard.',
            },
            {
              status: 'Scoring',
              color: 'purple',
              action: 'Open scoring',
              details: 'Players can now enter their hole-by-hole scores from the Dashboard.',
            },
            {
              status: 'Completed',
              color: 'green',
              action: 'Finalize the round',
              details: 'Points are calculated and the season leaderboard updates. Scores are locked.',
            },
          ].map((stage) => (
            <div key={stage.status} className="flex gap-3 items-start bg-white border rounded-lg p-4">
              <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 mt-0.5 ${
                stage.color === 'gray' ? 'bg-gray-100 text-gray-700' :
                stage.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                stage.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                stage.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                stage.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {stage.status}
              </span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{stage.action}</p>
                <p className="text-gray-600 text-xs mt-0.5">{stage.details}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border rounded-lg p-4 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Creating a Round</p>
          <ol className="text-gray-600 space-y-1 list-decimal list-inside text-xs">
            <li>Go to <strong>Admin → Rounds → New Round</strong></li>
            <li>Enter the round number, date, and tee time</li>
            <li>Save — the round starts in "Scheduled" status</li>
            <li>Use the round detail page to advance through the lifecycle</li>
          </ol>
        </div>
      </section>

      {/* Section 8: Foursomes */}
      <section id="foursomes" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🚗</span> Generating & Editing Foursomes
        </h2>
        <p className="text-gray-700 mb-4">
          From the round detail page, click <strong>"Generate Foursomes"</strong> once all 8 teams
          have declared their golfer. The algorithm runs 100 random shuffles and picks the grouping
          that minimizes repeat pairings from past rounds.
        </p>
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Foursome Structure</p>
          </div>
          <div className="grid grid-cols-2 divide-x text-sm">
            <div className="p-4">
              <p className="font-semibold text-gray-800 mb-2">Group 1 — Tee Slot 1</p>
              <div className="space-y-1.5">
                {['Cart 1 · Team A — Player', 'Cart 1 · Team B — Player', 'Cart 2 · Team C — Player', 'Cart 2 · Team D — Player'].map((p) => (
                  <div key={p} className="bg-gray-50 rounded px-2 py-1 text-xs text-gray-600">{p}</div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="font-semibold text-gray-800 mb-2">Group 2 — Tee Slot 2</p>
              <div className="space-y-1.5">
                {['Cart 1 · Team E — Player', 'Cart 1 · Team F — Player', 'Cart 2 · Team G — Player', 'Cart 2 · Team H — Player'].map((p) => (
                  <div key={p} className="bg-gray-50 rounded px-2 py-1 text-xs text-gray-600">{p}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
          <strong>Manual editing:</strong> After generating, you can drag and drop players between
          groups and carts on the round detail page. Tee times can also be adjusted from this view.
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
          Advance the round to <strong>"Foursomes Set"</strong> status to make the foursome
          assignments visible to players on the public leaderboard.
        </div>
      </section>

      {/* Section 9: Scoring */}
      <section id="scoring" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>🖊️</span> Managing Scores & Finalizing
        </h2>
        <p className="text-gray-700 mb-4">
          Once a round is in <strong>"Scoring"</strong> status, players enter their scores from
          the Dashboard. Admins can also view and edit all scores from the round detail page.
        </p>
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Admin Score View — Round Detail → Scores</p>
          </div>
          <div className="divide-y text-sm">
            {[
              { team: 'Team 1', player: 'Jane Smith', gross: 42, hcp: 8, net: 34, locked: true },
              { team: 'Team 2', player: 'Bob Jones', gross: 45, hcp: 14, net: 31, locked: false },
              { team: 'Team 3', player: 'Tom Miller', gross: 39, hcp: 5, net: 34, locked: false },
            ].map((row) => (
              <div key={row.team} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-xs">{row.player} <span className="text-gray-500">({row.team})</span></p>
                  <p className="text-gray-500 text-xs">Gross: {row.gross} · HCP: {row.hcp} · Net: {row.net}</p>
                </div>
                <div className="flex gap-2 text-xs items-center">
                  {row.locked
                    ? <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Locked</span>
                    : <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">Pending</span>
                  }
                  <button className="text-green-700 underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-white border rounded-lg p-4 text-sm">
            <p className="font-semibold text-gray-800 mb-1">Finalizing the Round</p>
            <ol className="text-gray-600 text-xs list-decimal list-inside space-y-1">
              <li>Review all scores on the admin score page</li>
              <li>Edit any incorrect entries</li>
              <li>Click <strong>"Finalize Round"</strong> on the round detail page</li>
              <li>Points are calculated by net score finish position</li>
              <li>The season leaderboard updates automatically</li>
            </ol>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            If points need recalculating after a correction, use the
            <strong> "Recalculate Points"</strong> button on the round detail page.
          </div>
        </div>
      </section>

      {/* Section 10: Audit Log */}
      <section id="audit" className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
          <span>📝</span> Audit Log
        </h2>
        <p className="text-gray-700 mb-4">
          Go to <strong>Admin → Audit Log</strong> to see a chronological history of all admin
          actions taken in the league — who changed what and when.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sample Audit Entries</p>
          </div>
          <div className="divide-y text-xs">
            {[
              { time: 'Today 2:14 PM', user: 'Admin', action: 'Finalized Round 5' },
              { time: 'Today 1:30 PM', user: 'Admin', action: 'Updated handicap for Bob Jones (14 → 12)' },
              { time: 'Today 11:05 AM', user: 'Admin', action: 'Generated foursomes for Round 5' },
              { time: 'Yesterday 4:22 PM', user: 'Admin', action: 'Created Round 6 (scheduled)' },
            ].map((entry) => (
              <div key={entry.time + entry.action} className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-gray-700">{entry.action}</span>
                <div className="text-right">
                  <p className="text-gray-500">{entry.user}</p>
                  <p className="text-gray-400">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t pt-6 mt-4 text-sm text-gray-500">
        <p>This is the admin guide. <Link href="/manual" className="text-green-700 underline">View the Player Manual →</Link></p>
        <p className="mt-1"><Link href="/leaderboard" className="text-green-700 underline">← Back to Leaderboard</Link></p>
      </div>
    </div>
  )
}
