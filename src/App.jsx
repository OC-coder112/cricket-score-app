import { useReducer, useState } from 'react'
import { AuthScreen, clearSession, getSession } from './Auth.jsx'
import './App.css'

const initialMatch = {
  teamA: '',
  teamB: '',
  oversLimit: 5,
  batting: 'A',
  runs: 0,
  wickets: 0,
  balls: 0,
  extras: 0,
  history: [],
  innings: 1,
  target: null,
  finished: false,
  result: '',
}

function formatOvers(balls) {
  return `${Math.floor(balls / 6)}.${balls % 6}`
}

function applyBall(state, event) {
  if (state.finished) return state

  const maxBalls = state.oversLimit * 6
  let { runs, wickets, balls, extras, history, batting, innings, target, teamA, teamB } = state
  let finished = false
  let result = ''
  let legal = true
  let runDelta = 0
  let wicketDelta = 0
  let extraDelta = 0
  let label = event

  switch (event) {
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '6':
      runDelta = Number(event)
      break
    case 'W':
      wicketDelta = 1
      label = 'Wicket'
      break
    case 'Wd':
      runDelta = 1
      extraDelta = 1
      legal = false
      label = 'Wide'
      break
    case 'Nb':
      runDelta = 1
      extraDelta = 1
      legal = false
      label = 'No ball'
      break
    default:
      return state
  }

  runs += runDelta
  wickets += wicketDelta
  extras += extraDelta
  if (legal) balls += 1

  history = [
    { id: crypto.randomUUID(), label, runs: runDelta, legal },
    ...history,
  ].slice(0, 24)

  const oversDone = balls >= maxBalls
  const allOut = wickets >= 10
  const chased = innings === 2 && target !== null && runs >= target

  if (chased) {
    finished = true
    const winner = batting === 'A' ? teamA : teamB
    result = `${winner} won by ${10 - wickets} wicket${10 - wickets === 1 ? '' : 's'}`
  } else if (oversDone || allOut) {
    if (innings === 1) {
      return {
        ...state,
        runs: 0,
        wickets: 0,
        balls: 0,
        extras: 0,
        history: [],
        batting: batting === 'A' ? 'B' : 'A',
        innings: 2,
        target: runs + 1,
        finished: false,
        result: '',
        firstInningsScore: runs,
        firstInningsWickets: wickets,
        firstInningsBalls: balls,
      }
    }

    finished = true
    if (runs === target - 1) {
      result = 'Match tied'
    } else {
      const winner = batting === 'A' ? teamB : teamA
      const margin = target - 1 - runs
      result = `${winner} won by ${margin} run${margin === 1 ? '' : 's'}`
    }
  }

  return {
    ...state,
    runs,
    wickets,
    balls,
    extras,
    history,
    finished,
    result,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...initialMatch,
        teamA: action.teamA,
        teamB: action.teamB,
        oversLimit: action.oversLimit,
        batting: action.batting,
      }
    case 'BALL':
      return applyBall(state, action.event)
    case 'UNDO': {
      if (!state.history.length || state.finished) return state
      const [last, ...rest] = state.history
      return {
        ...state,
        runs: state.runs - last.runs,
        wickets: last.label === 'Wicket' ? state.wickets - 1 : state.wickets,
        balls: last.legal ? state.balls - 1 : state.balls,
        extras: last.legal ? state.extras : state.extras - last.runs,
        history: rest,
      }
    }
    case 'RESET':
      return { ...initialMatch }
    default:
      return state
  }
}

function SetupScreen({ onStart }) {
  const [teamA, setTeamA] = useState('Strikers')
  const [teamB, setTeamB] = useState('Chasers')
  const [overs, setOvers] = useState(5)
  const [batting, setBatting] = useState('A')

  function handleSubmit(e) {
    e.preventDefault()
    if (!teamA.trim() || !teamB.trim()) return
    onStart({
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      oversLimit: Number(overs),
      batting,
    })
  }

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Live scoring</p>
        <h1 className="brand">PitchMark</h1>
        <p className="lede">
          Set the sides, pick who bats first, and mark every ball as it happens.
        </p>
      </div>

      <form className="setup-form" onSubmit={handleSubmit}>
        <label>
          Team A
          <input value={teamA} onChange={(e) => setTeamA(e.target.value)} required />
        </label>
        <label>
          Team B
          <input value={teamB} onChange={(e) => setTeamB(e.target.value)} required />
        </label>
        <label>
          Overs
          <select value={overs} onChange={(e) => setOvers(e.target.value)}>
            {[2, 5, 10, 20].map((n) => (
              <option key={n} value={n}>
                {n} overs
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Batting first</legend>
          <label className="radio">
            <input
              type="radio"
              name="batting"
              checked={batting === 'A'}
              onChange={() => setBatting('A')}
            />
            {teamA || 'Team A'}
          </label>
          <label className="radio">
            <input
              type="radio"
              name="batting"
              checked={batting === 'B'}
              onChange={() => setBatting('B')}
            />
            {teamB || 'Team B'}
          </label>
        </fieldset>
        <button type="submit" className="btn primary">
          Start match
        </button>
      </form>
    </section>
  )
}

function Scoreboard({ match }) {
  const battingName = match.batting === 'A' ? match.teamA : match.teamB
  const bowlingName = match.batting === 'A' ? match.teamB : match.teamA
  const runRate = match.balls ? ((match.runs / match.balls) * 6).toFixed(2) : '0.00'

  return (
    <header className="scoreboard">
      <div className="scoreboard-top">
        <span className="brand-mini">PitchMark</span>
        <span className="innings-tag">
          Innings {match.innings}
          {match.target ? ` · Target ${match.target}` : ''}
        </span>
      </div>
      <div className="score-main">
        <p className="batting-name">{battingName}</p>
        <p className="score-line">
          <span className="runs">{match.runs}</span>
          <span className="sep">/</span>
          <span className="wickets">{match.wickets}</span>
        </p>
        <p className="overs-line">
          Overs {formatOvers(match.balls)} of {match.oversLimit} · RR {runRate}
        </p>
      </div>
      <p className="bowling-name">Bowling · {bowlingName}</p>
      {match.innings === 2 && match.firstInningsScore != null && (
        <p className="prev-innings">
          {bowlingName} scored {match.firstInningsScore}/{match.firstInningsWickets} (
          {formatOvers(match.firstInningsBalls)})
        </p>
      )}
    </header>
  )
}

const SCORE_KEYS = ['0', '1', '2', '3', '4', '6', 'Wd', 'Nb', 'W']

function App() {
  const [user, setUser] = useState(() => getSession())
  const [match, dispatch] = useReducer(reducer, initialMatch)
  const started = Boolean(match.teamA && match.teamB)

  function handleLogout() {
    clearSession()
    setUser(null)
    dispatch({ type: 'RESET' })
  }

  if (!user) {
    return (
      <div className="app">
        <AuthScreen onAuth={setUser} />
      </div>
    )
  }

  if (!started) {
    return (
      <div className="app">
        <div className="user-bar">
          <span>Hi, {user.name}</span>
          <button type="button" className="btn ghost compact" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <SetupScreen
          onStart={(payload) => dispatch({ type: 'START', ...payload })}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="user-bar">
        <span>Hi, {user.name}</span>
        <button type="button" className="btn ghost compact" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <Scoreboard match={match} />

      {match.finished ? (
        <section className="result-panel">
          <h2>Match over</h2>
          <p>{match.result}</p>
          <button className="btn primary" onClick={() => dispatch({ type: 'RESET' })}>
            New match
          </button>
        </section>
      ) : (
        <section className="pad">
          <h2 className="pad-title">Mark the ball</h2>
          <div className="pad-grid">
            {SCORE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className={`pad-btn ${key === '4' || key === '6' ? 'boundary' : ''} ${
                  key === 'W' ? 'wicket' : ''
                } ${key === 'Wd' || key === 'Nb' ? 'extra' : ''}`}
                onClick={() => dispatch({ type: 'BALL', event: key })}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="pad-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={!match.history.length}
            >
              Undo
            </button>
            <button
              type="button"
              className="btn ghost danger"
              onClick={() => dispatch({ type: 'RESET' })}
            >
              End match
            </button>
          </div>
        </section>
      )}

      {match.history.length > 0 && (
        <section className="timeline">
          <h3>This innings</h3>
          <ol>
            {match.history.map((ball) => (
              <li key={ball.id} className={!ball.legal ? 'extra-ball' : ''}>
                {ball.label}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

export default App
