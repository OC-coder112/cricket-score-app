import { useState } from 'react'

const USERS_KEY = 'pitchmark-users'
const SESSION_KEY = 'pitchmark-session'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }))
}


export function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    setError('')
    const users = loadUsers()
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    )
    if (!user) {
      setError('Invalid email or password.')
      return
    }
    saveSession(user)
    onAuth(user)
  }

  function handleSignup(e) {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName || !trimmedEmail || password.length < 4) {
      setError('Enter name, email, and a password (min 4 characters).')
      return
    }
    const users = loadUsers()
    if (users.some((u) => u.email === trimmedEmail)) {
      setError('An account with this email already exists.')
      return
    }
    const user = { name: trimmedName, email: trimmedEmail, password }
    saveUsers([...users, user])
    saveSession(user)
    onAuth(user)
  }

  const isLogin = mode === 'login'

  return (
    <section className="hero auth-hero">
      <div className="hero-copy">
        <p className="eyebrow">PitchMark</p>
        <h1 className="brand">{isLogin ? 'Welcome back' : 'Join the score'}</h1>
        <p className="lede">
          {isLogin
            ? 'Log in to set up matches and mark every ball live.'
            : 'Create an account to start scoring your cricket matches.'}
        </p>
      </div>

      <div className="auth-panel">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setMode('login')
              setError('')
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setMode('signup')
              setError('')
            }}
          >
            Sign up
          </button>
        </div>

        <form className="setup-form auth-form" onSubmit={isLogin ? handleLogin : handleSignup}>
          {!isLogin && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? 'Your password' : 'At least 4 characters'}
              required
              minLength={isLogin ? undefined : 4}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn primary">
            {isLogin ? 'Login' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(isLogin ? 'signup' : 'login')
              setError('')
            }}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </section>
  )
}
