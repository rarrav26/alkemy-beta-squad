import { createContext, useMemo, useState } from 'react'
import { createTheme } from '@mui/material/styles'

// eslint-disable-next-line react-refresh/only-export-components
export const ElementosGlobales = createContext({})

export default function ElementosGlobalesProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true)
  const theme = useMemo(() => createTheme({
    palette: { mode: darkMode ? 'dark' : 'light',
      primary: { main: darkMode ? '#78b8ff' : '#1761ac' } },
    shape: { borderRadius: 12 },
    typography: { fontFamily: 'Inter, system-ui, sans-serif' }
  }), [darkMode])
  return <ElementosGlobales.Provider value={{ darkMode, setDarkMode, theme }}>
    {children}
  </ElementosGlobales.Provider>
}