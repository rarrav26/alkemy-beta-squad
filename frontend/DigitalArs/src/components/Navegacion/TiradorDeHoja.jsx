import Box from '@mui/material/Box'

// La rayita arriba de una hoja que sube desde abajo (Drawer anchor="bottom"): indica que el
// panel se arrastra o se cierra hacia abajo. La usan la campana y el menú "Más".
export default function TiradorDeHoja() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'divider',
        mx: 'auto',
        mt: 1.25
      }}
    />
  )
}
