import { Box, Typography } from '@mui/material'
export default function Footer() {
  return <Box component="footer" sx={{ py: 3, px: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary">© 2026 DigitalArs · Squad 2</Typography>
  </Box>
}