import ResponsiveAppBar from '../Header/ResponsiveAppBar'

import { useContext } from 'react'
import { ElementosGlobales } from '../../context/ElementosGlobales'

function Header() {
  const { search, setSearch } = useContext(ElementosGlobales)
  return (
    <header>
      <ResponsiveAppBar />
    </header>
  )
}

export default Header
