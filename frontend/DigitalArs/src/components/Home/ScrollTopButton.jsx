import IconButton from '@mui/material/IconButton'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

function ScrollTopButton() {
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <IconButton
      onClick={scrollToTop}
      aria-label='Volver arriba'
      sx={{
        position: 'fixed',
        bottom: 150,
        right: 24,
        zIndex: 1000,

        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        boxShadow: 4,

        '&:hover': {
          backgroundColor: 'primary.dark'
        }
      }}
    >
      <KeyboardArrowUpIcon />
    </IconButton>
  )
}

export default ScrollTopButton
