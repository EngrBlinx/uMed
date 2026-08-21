import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Slot = {
  id: string
  doctorId: string
  startsAt: string
  endsAt: string
  doctor: {
    specialty: string
    user: { firstName: string; lastName: string }
  }
}

type Appointment = {
  id: string
  status: string
  reason: string | null
  availabilitySlot: { startsAt: string; endsAt: string }
  doctor: {
    specialty: string
    user: { firstName: string; lastName: string }
  }
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value))
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function App() {
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  const [from, setFrom] = useState(toDateInputValue(today))
  const [to, setTo] = useState(toDateInputValue(nextWeek))
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [reason, setReason] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showSignIn, setShowSignIn] = useState(false)
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [signUpFirstName, setSignUpFirstName] = useState('')
  const [signUpLastName, setSignUpLastName] = useState('')
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signedInName, setSignedInName] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showDashboard, setShowDashboard] = useState(false)

  async function loadAppointments(id: string) {
    const response = await fetch(`${apiUrl}/patients/${id}/appointments`)
    if (response.ok) setAppointments(await response.json())
  }

  async function loadSlots() {
    setIsLoading(true)
    setError('')
    setNotice('')
    const params = new URLSearchParams({ from: new Date(`${from}T00:00:00`).toISOString(), to: new Date(`${to}T23:59:59`).toISOString() })
    if (doctorId.trim()) params.set('doctorId', doctorId.trim())
    try {
      const response = await fetch(`${apiUrl}/slots?${params}`)
      if (!response.ok) throw new Error('The availability service returned an error.')
      setSlots(await response.json())
    } catch {
      setError('We could not reach the booking service. Check that the backend is running on port 4000.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams({
      from: new Date(`${from}T00:00:00`).toISOString(),
      to: new Date(`${to}T23:59:59`).toISOString(),
    })
    if (doctorId.trim()) params.set('doctorId', doctorId.trim())

    fetch(`${apiUrl}/slots?${params}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('The availability service returned an error.')
        setSlots(await response.json())
      })
      .catch(() => setError('We could not reach the booking service. Check that the backend is running on port 4000.'))
      .finally(() => setIsLoading(false))
  }, [doctorId, from, to])

  useEffect(() => {
    if (selectedSlot) {
      document.getElementById('confirm-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedSlot])

  async function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedSlot || !patientId.trim()) return
    setError('')
    setNotice('')
    const response = await fetch(`${apiUrl}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patientId.trim(), availabilitySlotId: selectedSlot.id, reason: reason.trim() || undefined }),
    })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      setError(result.error ?? 'That appointment could not be booked.')
      return
    }
    setSelectedSlot(null)
    setReason('')
    setNotice('Appointment booked. Your time is reserved.')
    await loadSlots()
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await fetch(`${apiUrl}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signInEmail, password: signInPassword }),
    })
    const result = await response.json()
    if (!response.ok) {
      setError(result.error ?? 'Unable to sign in.')
      return
    }
    setPatientId(result.patientId ?? '')
    setSignedInName(`${result.user.firstName} ${result.user.lastName}`)
    if (result.patientId) {
      await loadAppointments(result.patientId)
      setShowDashboard(true)
    }
    setShowSignIn(false)
    setSignInPassword('')
    setNotice(`Welcome back, ${result.user.firstName}.`)
  }

  function appointmentDate(appointment: Appointment) {
    return formatDate(appointment.availabilitySlot.startsAt)
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await fetch(`${apiUrl}/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: signUpFirstName, lastName: signUpLastName, email: signInEmail, password: signInPassword }),
    })
    const result = await response.json()
    if (!response.ok) {
      setError(result.error ?? 'Unable to create your account.')
      return
    }
    setAuthMode('sign-in')
    setSignInPassword('')
    setNotice('Account created. Sign in to continue.')
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="/" aria-label="uMed home"><span className="brand-mark">u</span><span>uMed</span></a>
        <div className="topbar-status"><span className="status-dot" />Appointments without the waiting room</div>
        <button className="quiet-button" type="button" onClick={() => signedInName ? setShowDashboard((isOpen) => !isOpen) : setShowSignIn((isOpen) => !isOpen)}>{signedInName || 'Sign in'}</button>
      </nav>

      {showSignIn && <section className="auth-panel" aria-labelledby="auth-heading"><div><p className="eyebrow">Your account</p><h2 id="auth-heading">{authMode === 'sign-in' ? 'Sign in to book faster' : 'Create your patient account'}</h2><p>{authMode === 'sign-in' ? 'Use your patient account and we will fill in your booking details.' : 'Register once, then choose appointments without waiting in line.'}</p><button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in'); setError('') }}>{authMode === 'sign-in' ? 'New patient? Create an account' : 'Already registered? Sign in'}</button></div><form onSubmit={authMode === 'sign-in' ? signIn : signUp}>{authMode === 'sign-up' && <><label>First name<input required placeholder="Amina" value={signUpFirstName} onChange={(event) => setSignUpFirstName(event.target.value)} /></label><label>Last name<input required placeholder="Mensah" value={signUpLastName} onChange={(event) => setSignUpLastName(event.target.value)} /></label></>}<label>Email<input required type="email" placeholder="you@example.com" value={signInEmail} onChange={(event) => setSignInEmail(event.target.value)} /></label><label>Password<input required minLength={8} type="password" placeholder="At least 8 characters" value={signInPassword} onChange={(event) => setSignInPassword(event.target.value)} /></label><button className="primary-button" type="submit">{authMode === 'sign-in' ? 'Sign in' : 'Create account'} <span aria-hidden="true">-&gt;</span></button></form></section>}

      {showDashboard && signedInName && <section className="dashboard-panel" aria-labelledby="dashboard-heading"><div className="dashboard-header"><div><p className="eyebrow">Patient dashboard</p><h2 id="dashboard-heading">Good to see you, {signedInName.split(' ')[0]}.</h2></div><button className="quiet-button" type="button" onClick={() => setShowDashboard(false)}>Close</button></div><div className="dashboard-grid"><div className="next-visit">{appointments.length > 0 ? <><p className="dashboard-label">Next appointment</p><h3>{appointmentDate(appointments[0])}</h3><strong>{formatTime(appointments[0].availabilitySlot.startsAt)}</strong><p>Dr. {appointments[0].doctor.user.firstName} {appointments[0].doctor.user.lastName}<br />{appointments[0].doctor.specialty}</p><span className="appointment-status">{appointments[0].status}</span></> : <><p className="dashboard-label">Next appointment</p><h3>No appointment booked</h3><p>Choose an available time below to keep your visit out of the queue.</p><button className="primary-button" type="button" onClick={() => { setShowDashboard(false); document.getElementById('find-heading')?.scrollIntoView({ behavior: 'smooth' }) }}>Find a time <span aria-hidden="true">-&gt;</span></button></>}</div><div className="appointment-history"><div className="history-heading"><p className="dashboard-label">Appointment history</p><span>{appointments.length} total</span></div>{appointments.length === 0 ? <p className="history-empty">Your confirmed appointments will appear here.</p> : appointments.map((appointment) => <div className="history-row" key={appointment.id}><div><strong>{appointmentDate(appointment)} at {formatTime(appointment.availabilitySlot.startsAt)}</strong><span>Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}</span></div><b>{appointment.status}</b></div>)}</div></div></section>}

      <section className="hero-section">
        <div className="hero-copy"><p className="eyebrow">Your time matters</p><h1>Care that starts <em>before</em> you arrive.</h1><p className="hero-text">Find a time that works, reserve it in seconds, and spend less of your day in a queue.</p><div className="trust-row"><span>01</span><span>Live availability</span><span className="trust-line" /><span>02</span><span>Confirmed booking</span></div></div>
        <div className="hero-note"><span className="note-label">The uMed promise</span><p>One clear appointment. No paper slips. No guessing when you will be seen.</p></div>
      </section>

      <section className="booking-panel" aria-labelledby="find-heading">
        <div className="panel-heading"><div><p className="eyebrow">Book a visit</p><h2 id="find-heading">Find an available time</h2></div><span className="live-label"><span className="status-dot" />Live</span></div>
        <form className="filters" onSubmit={(event) => { event.preventDefault(); void loadSlots() }}>
          <label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label>To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
          <label className="doctor-filter">Doctor ID <span>(optional)<input placeholder="Paste doctor ID" value={doctorId} onChange={(event) => setDoctorId(event.target.value)} /></span></label>
          <button className="primary-button" type="submit">Search times <span aria-hidden="true">-&gt;</span></button>
        </form>
      </section>

      <section className="results-section">
        <div className="results-heading"><div><p className="eyebrow">Availability</p><h2>{isLoading ? 'Checking the schedule...' : `${slots.length} times available`}</h2></div><span className="date-range">{formatDate(new Date(`${from}T12:00:00`).toISOString())} - {formatDate(new Date(`${to}T12:00:00`).toISOString())}</span></div>
        {error && <div className="message error-message" role="alert">{error}</div>}
        {notice && <div className="message success-message" role="status">{notice}</div>}
        {isLoading ? <div className="empty-state"><div className="loader" /><p>Looking for open times...</p></div> : slots.length === 0 ? <div className="empty-state"><div className="empty-icon">+</div><h3>No open times yet</h3><p>Once a clinic publishes availability, the next appointment will appear here.</p></div> : <div className="slot-grid">{slots.map((slot) => <button className={`slot-card ${selectedSlot?.id === slot.id ? 'selected' : ''}`} key={slot.id} type="button" onClick={() => setSelectedSlot(slot)}><span>{formatDate(slot.startsAt)}</span><strong>{formatTime(slot.startsAt)}</strong><small>Dr. {slot.doctor.user.firstName} {slot.doctor.user.lastName}<br />{slot.doctor.specialty}<i>+</i></small></button>)}</div>}
      </section>

      {selectedSlot && <section id="confirm-panel" className="confirm-panel" aria-labelledby="confirm-heading"><div><p className="eyebrow">Selected time</p><h2 id="confirm-heading">{formatDate(selectedSlot.startsAt)}, {formatTime(selectedSlot.startsAt)}</h2><p>Dr. {selectedSlot.doctor.user.firstName} {selectedSlot.doctor.user.lastName}, {selectedSlot.doctor.specialty}</p></div><form onSubmit={bookAppointment}><label>Patient ID<input required placeholder="Enter patient ID" value={patientId} onChange={(event) => setPatientId(event.target.value)} /></label><label>Reason <span>(optional)<input placeholder="e.g. routine check-up" value={reason} onChange={(event) => setReason(event.target.value)} /></span></label><button className="primary-button" type="submit">Confirm appointment <span aria-hidden="true">-&gt;</span></button></form></section>}

      <footer><span>uMed / clinic access, made calmer.</span><span>Built for fewer queues.</span></footer>
    </main>
  )
}

export default App
