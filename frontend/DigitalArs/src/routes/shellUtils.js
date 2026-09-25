// Qué "cáscara" envuelve a la app: la navegación y el cromo que rodean a las rutas. Las tres
// son excluyentes — en cualquier momento se dibuja exactamente una.
//
//   clasico     AppBar horizontal + Footer. Es el de siempre.
//   mobile      encabezado propio + barra inferior fija con el botón de QR.
//   escritorio  barra lateral fija + encabezado delgado.
export const SHELL_CLASICO = 'clasico'
export const SHELL_MOBILE = 'mobile'
export const SHELL_ESCRITORIO = 'escritorio'

// Decide la cáscara. Es una función PURA y no un hook a propósito: así se prueba sin React, y
// es la ÚNICA que responde esta pregunta. Si App y Dashboard hicieran cada uno su propia
// cuenta podrían no coincidir, y el resultado se ve enseguida: una pantalla con las dos
// navegaciones a la vez, o con ninguna.
//
// Sin sesión activa (login, registro, o mientras se verifica contra el servidor) va el clásico:
// todavía no hay secciones que navegar. Nótese que "activa" acá significa VERIFICADA — ver
// esSesionActiva en rolesUtils.
//
// Con sesión, decide solo el ancho. El ROL no entra en esta cuenta: las dos cáscaras nuevas
// atienden a los dos roles, porque ninguna es una lista fija de pantallas de billetera — cada
// una recorre la lista de secciones del rol que corresponda (ver navegacionUtils). Eso es lo que
// deja al administrador con barra inferior en el teléfono y barra lateral en el escritorio, con
// sus propias secciones en las dos.
export function shellQueCorresponde({ sesionActiva, esPantallaChica }) {
  if (!sesionActiva) return SHELL_CLASICO

  return esPantallaChica ? SHELL_MOBILE : SHELL_ESCRITORIO
}
