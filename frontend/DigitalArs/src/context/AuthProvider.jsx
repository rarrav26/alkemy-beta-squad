import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import { apiRequest } from './api'

const storageKey = 'digitalars.session'
function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey))
    return value?.token && Date.parse(value.expiresAt) > Date.now() ? value : null
  } catch { return null }
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const [ready, setReady] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const logout = useCallback(() => {
    sessionStorage.removeItem(storageKey)
    setSession(null)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function initialize() {
      try {
        const status = await apiRequest('/api/setup/status', { signal: controller.signal })
        const saved = readSession()
        let restored = null
        if (saved) {
          try {
            const user = await apiRequest('/api/auth/me', { token: saved.token, signal: controller.signal })
            restored = { ...saved, user }
          } catch (error) {
            if (error.status !== 401) throw error
          }
        }
        if (controller.signal.aborted) return
        if (!restored) sessionStorage.removeItem(storageKey)
        setSession(restored)
        if (status.requiresSetup) throw new Error('La instalación no está completa. Contactá al responsable de la aplicación.')
        setConnectionError('')
        setReady(true)
      } catch (error) {
        if (controller.signal.aborted) return
        setConnectionError(error.message)
        setReady(true)
      }
    }
    initialize()
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    if (!session) return
    const timeout = setTimeout(logout, Math.max(0, Date.parse(session.expiresAt) - Date.now()))
    return () => clearTimeout(timeout)
  }, [session, logout])

  async function saveLogin(result) {
    const user = await apiRequest('/api/auth/me', { token: result.token })
    const value = { token: result.token, expiresAt: result.expiresAt, user }
    sessionStorage.setItem(storageKey, JSON.stringify(value))
    setSession(value)
  }
  async function login(data) {
    await saveLogin(await apiRequest('/api/auth/login', { method: 'POST', body: data }))
  }
  async function register(data) {
    return apiRequest('/api/auth/register', { method: 'POST', body: data })
  }
  async function initialPassword(data) {
    await saveLogin(await apiRequest('/api/auth/initial-password', { method: 'POST', body: data }))
  }
  async function authenticatedRequest(path, options = {}) {
    if (!session) throw new Error('Iniciá sesión para continuar.')
    try { return await apiRequest(path, { ...options, token: session.token }) }
    catch (error) { if (error.status === 401) logout(); throw error }
  }
  function createUser(data) {
    return authenticatedRequest('/api/usuarios', { method: 'POST', body: data })
  }
  function retry() { setReady(false); setConnectionError(''); setAttempt(value => value + 1) }

  return <AuthContext.Provider value={{
    session, ready, connectionError,
    login, register, initialPassword,
    createUser, logout, retry
  }}>{children}</AuthContext.Provider>
}
