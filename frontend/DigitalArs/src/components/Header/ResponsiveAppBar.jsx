import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuIcon from '@mui/icons-material/Menu'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { useContext, useState, useRef } from 'react'
import { ElementosGlobales } from '../../context/ElementosGlobales'
import SearchBar from './Searchbar'
import ChangeTheme from './ChangeTheme'
const pages = ['Products']
import { Link } from 'react-router-dom'
function ResponsiveAppBar() {
  const { search, setSearch } = useContext(ElementosGlobales)

  const [anchorElNav, setAnchorElNav] = useState(null)

  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef(null)

  const handleOpenNavMenu = event => {
    setAnchorElNav(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  return (
    <AppBar position='static'>
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          {/* BLOQUE IZQUIERDO */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {/* Hamburguesa mobile */}
            <IconButton
              color='inherit'
              onClick={handleOpenNavMenu}
              sx={{
                display: {
                  xs: 'flex',
                  md: 'none'
                }
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Carrito */}
            <Link
              to='/'
              style={{
                display: 'flex',
                color: 'inherit',
                textDecoration: 'none'
              }}
            >
              <ShoppingCartIcon />
            </Link>
            {/* Nombre */}
            <Typography
              variant='h6'
              noWrap
              component='a'
              href='/'
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '1.2rem',
                letterSpacing: '.08rem',
                color: 'inherit',
                textDecoration: 'none',

                '@media (max-width: 520px)': {
                  display: 'none'
                }
              }}
            >
              ReactCommerce
            </Typography>
          </Box>

          {/* MENÚ ESCRITORIO */}
          <Box
            sx={{
              ml: 3,
              display: {
                xs: 'none',
                md: 'flex'
              }
            }}
          >
            {pages.map(page => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{
                  color: 'white'
                }}
              >
                {page}
              </Button>
            ))}
          </Box>

          {/* ESPACIO FLEXIBLE */}
          <Box sx={{ flexGrow: 1 }} />

          {/* BLOQUE DERECHO */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <SearchBar />
            <ChangeTheme />
          </Box>
          <Menu
            anchorEl={anchorElNav}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
          >
            {pages.map(page => (
              <MenuItem key={page} onClick={handleCloseNavMenu}>
                <Typography>{page}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default ResponsiveAppBar
