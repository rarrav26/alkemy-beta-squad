import { useContext, useState, useRef } from 'react'

import { ElementosGlobales } from '../../context/ElementosGlobales'

import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'

function SearchBar() {
  const { search, setSearch } = useContext(ElementosGlobales)

  const [searchFocused, setSearchFocused] = useState(false)

  const inputRef = useRef(null)

  const handleSearchOpen = () => {
    setSearchFocused(true)

    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <TextField
      size='small'
      placeholder='Find product...'
      value={search}
      inputRef={inputRef}
      onChange={event => setSearch(event.target.value)}
      onFocus={() => setSearchFocused(true)}
      onBlur={() => setSearchFocused(false)}
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 1,

        width: {
          xs: searchFocused || search ? 200 : 48,
          sm: 220,
          md: 250
        },

        transition: 'width 0.3s ease',

        '& .MuiInputBase-root': {
          height: 48,

          justifyContent: {
            xs: searchFocused || search ? 'flex-start' : 'center',
            sm: 'flex-start'
          },

          paddingLeft: {
            xs: searchFocused || search ? 1 : 0,
            sm: 1
          }
        },

        '& .MuiInputAdornment-root': {
          margin: 0
        },

        '& .MuiIconButton-root': {
          margin: 0
        },

        '& .MuiInputBase-input': {
          width: {
            xs: searchFocused || search ? '100%' : 0,
            sm: '100%'
          },

          padding: {
            xs: searchFocused || search ? undefined : 0
          },

          flex: {
            xs: searchFocused || search ? 1 : 0
          },

          transition: 'width 0.3s ease'
        }
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position='start'>
              <IconButton
                size='small'
                onClick={handleSearchOpen}
                edge='start'
                aria-label='Buscar producto'
              >
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  )
}

export default SearchBar
