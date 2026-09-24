import { createContext, useContext } from 'react'

export const NotificacionesContext = createContext(null)

export function useNotificaciones() {
  const context = useContext(NotificacionesContext)
  if (!context) throw new Error('NotificacionesProvider no está disponible')
  return context
}
