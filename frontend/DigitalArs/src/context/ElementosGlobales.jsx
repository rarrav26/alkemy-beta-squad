import { createContext, useState, useEffect } from 'react'
import { createTheme } from '@mui/material/styles'

export const ElementosGlobales = createContext({})

export default function ElementosGlobalesProvider(props) {
  const { children } = props

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [darkMode, setDarkMode] = useState(true)

  const [search, setSearch] = useState('')

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light'
    }
  })

  async function getProducts() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('https://dummyjson.com/ducts?limit=12')

      if (!response.ok) {
        throw new Error('No se pudieron obtener los productos')
      }

      const data = await response.json()

      setProducts(data.products)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const valoresGlobales = {
    products,
    loading,
    error,
    darkMode,
    setDarkMode,
    theme,
    search,
    setSearch
  }

  useEffect(() => {
    getProducts()
  }, [])

  return (
    <ElementosGlobales.Provider value={valoresGlobales}>
      {children}
    </ElementosGlobales.Provider>
  )
}
