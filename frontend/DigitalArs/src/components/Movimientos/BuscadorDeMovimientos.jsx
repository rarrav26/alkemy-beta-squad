import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import SearchRounded from '@mui/icons-material/SearchRounded'

// Buscador del historial mobile, en forma de píldora. Tipear no consulta nada: la búsqueda
// se aplica al enviarla (la tecla "Buscar" del teclado del teléfono o Enter). La API busca
// por nombre de tipo de movimiento ("transferencia", "depósito"), de ahí el texto de ayuda.
//
// El texto lo guarda la pantalla y no este componente: así "Limpiar filtros" también vacía
// la caja, y no queda escrita una búsqueda que ya no se está aplicando.
export default function BuscadorDeMovimientos({ texto, onCambiarTexto, onBuscar }) {
  function enviar(evento) {
    evento.preventDefault()
    onBuscar(texto)
  }

  // Borrar todo el texto quita la búsqueda sin tener que enviar: si no, la lista seguiría
  // filtrada con la caja vacía y no se entendería por qué faltan movimientos.
  function cambiarTexto(evento) {
    const textoNuevo = evento.target.value
    onCambiarTexto(textoNuevo)

    if (textoNuevo === '') {
      onBuscar('')
    }
  }

  return (
    <Box component="form" role="search" onSubmit={enviar} sx={{ flexGrow: 1, minWidth: 0 }}>
      <TextField
        fullWidth
        type="search"
        // Corto a propósito: con el botón de filtros al lado, a 360–375px no entra más texto.
        placeholder="Buscá por tipo"
        value={texto}
        onChange={cambiarTexto}
        slotProps={{
          htmlInput: { 'aria-label': 'Buscar movimientos', enterKeyHint: 'search' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded aria-hidden="true" />
              </InputAdornment>
            )
          }
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999, height: 48 } }}
      />
    </Box>
  )
}
