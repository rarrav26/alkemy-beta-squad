// Esconde un elemento de la vista pero lo deja para el lector de pantalla. Se usa en los
// títulos de página que no se dibujan: cada pantalla necesita un h1 para que se pueda navegar
// por encabezados, pero en Inicio el encabezado ya saluda al usuario y repetir "Inicio" arriba
// de la tarjeta solo ocuparía lugar.
//
// No se usa `display: none` ni `visibility: hidden`: los dos lo esconden también del lector.
export const OCULTO_A_LA_VISTA = {
  position: 'absolute',
  // En texto y no como número: en sx, `width: 1` significa 100%, no 1px.
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap'
}
