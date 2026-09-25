// Estilo del papel de las hojas inferiores (el menú "Más" y los filtros de fecha): esquinas
// redondeadas arriba, respeto por la franja del gesto de iOS, y vidrio.
//
// Vive acá y no en el tema por una razón concreta, verificada en el código de MUI: `DrawerPaper`
// se declara con `styled(Paper, { name: 'MuiDrawer', slot: 'Paper' })` SIN `overridesResolver`, así
// que un `MuiDrawer.styleOverrides.paper` en el tema no se resuelve -- se ignoraría en silencio, sin
// error y sin aviso. Los diálogos sí van por el tema, porque `DialogPaper` sí lo tiene.
//
// El otro motivo para centralizarlo: las dos hojas tenían el mismo bloque de estilos copiado. Si
// una cambiaba el radio y la otra no, el usuario veía dos hojas distintas abriéndose igual.
export function papelDeHojaInferior(tema) {
  return {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    pb: 'env(safe-area-inset-bottom)',

    // Mismo vidrio que los diálogos: una hoja inferior es un diálogo que entra desde abajo, y su
    // velo también se difumina, así que lo que se ve detrás es un lavado y no texto legible.
    backgroundColor: tema.palette.superficies.vidrioFlotante,
    backdropFilter: tema.palette.superficies.difuminadoFlotante,
    WebkitBackdropFilter: tema.palette.superficies.difuminadoFlotante,

    // Un Drawer temporal lleva elevación 16, y en modo oscuro MUI le suma por eso un degradé
    // blanco (`--Paper-overlay`) que sobre un fondo traslúcido lo vuelve a tapar. Sin esta línea
    // el vidrio no se ve y no hay ningún error que lo explique.
    backgroundImage: 'none',

    // Solo el canto de arriba: es el único borde que se ve, porque los otros tres quedan fuera
    // de la pantalla. Es lo que le da el filo a la hoja contra el contenido difuminado.
    borderTop: `1px solid ${tema.palette.divider}`
  }
}
