import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import GroupRounded from '@mui/icons-material/GroupRounded'
import PersonAddRounded from '@mui/icons-material/PersonAddRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import { useNavigate } from 'react-router-dom'

import ListaDeGestion from '../Comunes/ListaDeGestion'
import Aparicion from '../Comunes/Aparicion'

// Mismo tope que el Inicio del usuario regular: sin él, en un monitor grande las tres filas se
// estirarían de borde a borde y el ojo tendría que barrer toda la pantalla para leer una.
const ANCHO_MAXIMO = 900

// El Inicio del administrador. Antes esta pantalla mostraba su rol, su email y un botón de texto
// a "Registrar usuario", y el listado de usuarios no figuraba en ninguna navegación. Ahora las
// secciones están en la barra lateral, así que esto es la portada del panel: las mismas tres
// entradas, con la lista de gestión que ya usan Cuentas y Tarjetas.
//
// No saluda por nombre a propósito: el encabezado de la cáscara de escritorio ya lo hace, y
// repetirlo dejaba dos saludos en la misma pantalla. El título hace de h1 visible, así que acá
// no hace falta el h1 escondido que sí usa el Inicio del usuario regular.
//
// Tampoco usa datos de muestra: todo lo de acá funciona de verdad, así que no lleva ningún chip
// "Próximamente".
export default function InicioDelAdmin() {
  const navegar = useNavigate()

  const opciones = [
    {
      id: 'usuarios',
      titulo: 'Usuarios',
      descripcion: 'Buscá una cuenta, mirá su detalle y editá sus datos.',
      Icono: GroupRounded,
      onClick: () => navegar('/admin/usuarios')
    },
    {
      id: 'nuevo-usuario',
      titulo: 'Registrar usuario',
      descripcion: 'Le enviamos un correo para que elija su contraseña.',
      Icono: PersonAddRounded,
      onClick: () => navegar('/usuarios/nuevo')
    },
    {
      id: 'perfil',
      titulo: 'Mi perfil',
      descripcion: 'Revisá y actualizá tus propios datos.',
      Icono: PersonRounded,
      onClick: () => navegar('/perfil')
    }
  ]

  return (
    <Box sx={{ maxWidth: ANCHO_MAXIMO, mx: 'auto', px: { xs: 2, md: 4 }, pt: { xs: 2, md: 1 }, pb: 4 }}>
      <Stack spacing={3}>
        <Aparicion orden={0}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
            Panel de administración
          </Typography>
        </Aparicion>

        <Aparicion orden={1}>
          <ListaDeGestion
            titulo="Qué podés hacer"
            idDelTitulo="titulo-acciones-del-admin"
            opciones={opciones}
          />
        </Aparicion>
      </Stack>
    </Box>
  )
}
