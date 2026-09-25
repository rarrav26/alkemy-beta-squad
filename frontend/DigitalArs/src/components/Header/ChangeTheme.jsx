import { useContext } from 'react'

import IconButton from '@mui/material/IconButton'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'

import { ElementosGlobales } from '../../context/ElementosGlobales'

function ChangeTheme() {
  const { darkMode, setDarkMode } = useContext(ElementosGlobales)

  function changeTheme() {
    setDarkMode(prev => !prev)
  }

  return (
    <IconButton color='inherit' onClick={changeTheme} aria-label='Cambiar tema'>
      {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
    </IconButton>
  )
}

export default ChangeTheme
