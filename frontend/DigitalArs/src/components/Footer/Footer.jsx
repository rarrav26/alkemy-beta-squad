import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import IconButton from '@mui/material/IconButton'

import FacebookIcon from '@mui/icons-material/Facebook'
import TwitterIcon from '@mui/icons-material/Twitter'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'

function Footer() {
  return (
    <Box
      component='footer'
      sx={{
        py: 6,
        px: 2,
        mt: 4,
        textAlign: 'center',

        borderTop: '1px solid white'
      }}
    >
      {/* Logo */}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          mb: 3
        }}
      >
        <ShoppingCartIcon />

        <Typography
          variant='h6'
          sx={{
            fontWeight: 700
          }}
        >
          ReactCommerce
        </Typography>
      </Box>

      {/* Links */}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: {
            xs: 2,
            sm: 4
          },
          flexWrap: 'wrap',
          mb: 3
        }}
      ></Box>

      {/* Redes sociales */}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          mb: 3
        }}
      >
        <Link
          href='https://www.facebook.com/share/1HQ1VhKSBA/?mibextid=wwXIfr'
          target='_blank'
          rel='noopener noreferrer'
          underline='none'
          color='text.primary'
        >
          <IconButton aria-label='Facebook'>
            <FacebookIcon />
          </IconButton>
        </Link>

        <Link
          href='https://www.instagram.com/lobos_martin/'
          target='_blank'
          rel='noopener noreferrer'
          underline='none'
          color='text.primary'
        >
          <IconButton aria-label='Instagram'>
            <InstagramIcon />
          </IconButton>
        </Link>

        <Link
          href='https://www.linkedin.com/in/mart%C3%ADn-lobos/'
          target='_blank'
          rel='noopener noreferrer'
          underline='none'
          color='text.primary'
        >
          <IconButton aria-label='LinkedIn'>
            <LinkedInIcon />
          </IconButton>
        </Link>
      </Box>

      {/* Copyright */}

      <Typography variant='body2' color='text.secondary'>
        © 2026 ReactCommerce - Lobos Martín. All rights reserved.
      </Typography>
    </Box>
  )
}

export default Footer
