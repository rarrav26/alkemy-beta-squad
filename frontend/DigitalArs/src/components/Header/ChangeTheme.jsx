import { useContext } from 'react'

import IconButton from '@mui/material/IconButton'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'

import { ElementosGlobales } from '../../context/ElementosGlobales'

function ChangeTheme() {
  const { darkMode, setDarkMode } = useContext(ElementosGlobales)

  function changeTheme() {
    setDarkMode(prev => !prev)
  }

  return (
    <IconButton color='inherit' onClick={changeTheme} aria-label='Cambiar tema'>
      {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  )
}

export default ChangeTheme
