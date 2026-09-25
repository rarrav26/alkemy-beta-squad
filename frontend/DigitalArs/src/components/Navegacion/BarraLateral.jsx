import { useState } from 'react'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/authContext'
import {
  seccionActivaDeLaRutaEnEscritorio,
  seccionesDeEscritorio
} from '../../routes/navegacionUtils'
import { esAdministrador } from '../../routes/rolesUtils'
import AvisoProximamente from '../Proximamente/AvisoProximamente'
import ChipProximamente from '../Proximamente/ChipProximamente'
import { ATAJOS_DE_MUESTRA } from '../Proximamente/datosDeMuestra'
import { ICONO_POR_SECCION } from './iconosDeSeccion'

// Lo exporta para que la cáscara de escritorio reserve exactamente este ancho y el contenido no
// quede por debajo de la barra.
export const ANCHO_DE_LA_BARRA_LATERAL = 248

// Barra de navegación fija a la izquierda, solo en escritorio (ver shellUtils). Reemplaza al
// AppBar horizontal: en una pantalla ancha el alto es lo que escasea y el ancho lo que sobra,
// así que la navegación conviene en el eje que sobra.
//
// Atiende a los dos roles, con su propia lista de secciones cada uno. Con eso resuelve dos
// agujeros que tenía el AppBar: nunca se actualizó cuando aparecieron Tarjetas y Movimientos
// (en escritorio no había forma de llegar a ellas), y el panel de administración solo se
// alcanzaba desde un botón de texto adentro del Inicio.
export default function BarraLateral() {
  const ubicacion = useLocation()
  const { session, logout } = useAuth()
  const [avisoAbierto, setAvisoAbierto] = useState(false)

  const esAdmin = esAdministrador(session)
  const secciones = seccionesDeEscritorio(esAdmin)
  const seccionActiva = seccionActivaDeLaRutaEnEscritorio(ubicacion.pathname, esAdmin)

  // logout() se llama sin argumentos a propósito: su primer parámetro es el motivo que se le
  // muestra al usuario en el login, y pasarle el evento del click lo pondría como motivo.
  function cerrarSesion() {
    logout()
  }

  return (
    <Drawer
      variant="permanent"
      // sx como FUNCIÓN y no como objeto: adentro de un objeto sx, una propiedad cuyo valor es una
      // función no se evalúa — MUI la pasa tal cual y el estilo se pierde sin avisar.
      sx={tema => ({
        width: ANCHO_DE_LA_BARRA_LATERAL,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: ANCHO_DE_LA_BARRA_LATERAL,
          boxSizing: 'border-box',
          // Sin borde derecho propio: el contraste de la superficie contra el fondo ya separa la
          // barra del contenido en los dos temas.
          borderRight: 0,
          // Vidrio, igual que la barra inferior: más opaca que las tarjetas porque es fija y el
          // contenido pasa por debajo. Así los rayos del fondo también la cruzan.
          backgroundColor: tema.palette.superficies.vidrioDeNavegacion,
          backdropFilter: tema.palette.superficies.difuminado,
          WebkitBackdropFilter: tema.palette.superficies.difuminado
        }
      })}
    >
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography
          component={Link}
          to="/dashboard"
          variant="h6"
          sx={{ fontWeight: 800, color: 'text.primary', textDecoration: 'none' }}
        >
          DigitalArs
        </Typography>
      </Box>

      <List component="nav" aria-label="Navegación principal" sx={{ px: 1 }}>
        {secciones.map(({ id, etiqueta, to }) => {
          const Icono = ICONO_POR_SECCION[id]
          const activa = id === seccionActiva

          return (
            <ListItemButton
              key={id}
              component={Link}
              to={to}
              selected={activa}
              // selected solo pinta: aria-current es lo que le dice a un lector de pantalla que
              // esta es la página en la que está.
              aria-current={activa ? 'page' : undefined}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: activa ? 'primary.main' : 'text.secondary' }}>
                <Icono aria-hidden="true" />
              </ListItemIcon>
              <ListItemText
                primary={etiqueta}
                slotProps={{ primary: { sx: { fontWeight: activa ? 700 : 500 } } }}
              />
            </ListItemButton>
          )
        })}
      </List>

      {/* Los productos que todavía no existen. Son de billetera (plazo fijo, recargas,
          servicios, préstamos), así que al administrador no se le muestran: para él serían
          cuatro filas que no le prometen nada.
          En mobile son la grilla de atajos; acá van como filas de la barra, que es donde se ven
          sin parecer un botón que promete algo. También llenan una barra que con cinco secciones
          quedaría vacía de la mitad para abajo.
          No se dibuja la insignia ("Nuevo") de datosDeMuestra: al lado de "Próximamente" se
          contradiría. */}
      {!esAdmin && (
        <>
          <Divider sx={{ mx: 2, my: 1 }} />

          <Typography
            id="titulo-proximos-productos"
            component="h2"
            variant="overline"
            sx={{ px: 2.5, color: 'text.secondary' }}
          >
            Próximos productos
          </Typography>

          <List aria-labelledby="titulo-proximos-productos" sx={{ px: 1 }}>
            {ATAJOS_DE_MUESTRA.map(({ id, etiqueta, Icono }) => (
              <ListItemButton key={id} onClick={() => setAvisoAbierto(true)} sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                  <Icono aria-hidden="true" />
                </ListItemIcon>
                <ListItemText
                  primary={etiqueta}
                  slotProps={{ primary: { sx: { color: 'text.secondary' } } }}
                />
              </ListItemButton>
            ))}

            <Box sx={{ px: 2, pt: 0.5 }}>
              <ChipProximamente />
            </Box>
          </List>
        </>
      )}

      {/* mt: auto empuja el cierre de sesión al pie de la barra, lejos de la navegación: es una
          acción destructiva y no una sección más. */}
      <Box sx={{ mt: 'auto', px: 1, pb: 2 }}>
        <Divider sx={{ mx: 1, mb: 1 }} />

        <ListItemButton onClick={cerrarSesion} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
            <LogoutRounded aria-hidden="true" />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </Box>

      <AvisoProximamente open={avisoAbierto} onClose={() => setAvisoAbierto(false)} />
    </Drawer>
  )
}
