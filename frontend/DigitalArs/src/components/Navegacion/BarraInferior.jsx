import { useState } from 'react'

import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Fab from '@mui/material/Fab'
import Paper from '@mui/material/Paper'
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import QrCodeScannerRounded from '@mui/icons-material/QrCodeScannerRounded'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/authContext'
import {
  SECCION_MAS,
  pestanasDeMobile,
  seccionActivaDeLaRuta
} from '../../routes/navegacionUtils'
import { esAdministrador } from '../../routes/rolesUtils'
import AvisoProximamente from '../Proximamente/AvisoProximamente'
import { ICONO_POR_SECCION } from './iconosDeSeccion'
import MenuMas from './MenuMas'

// Valor del hueco central. No es una sección: nunca se marca ni navega a ningún lado.
const HUECO_DEL_BOTON_QR = 'hueco-del-boton-qr'

// Barra de navegación fija abajo, solo en mobile (ver shellUtils). Atiende a los dos roles, con
// su propia lista de pestañas cada uno: la última es siempre "Más", que abre una hoja con las
// secciones que no entran acá.
//
// El botón de QR flotante es de billetera y solo lo ve el usuario regular: todavía no existe en
// la app, así que responde con el aviso "Próximamente". Para el administrador no se dibuja, y con
// él desaparece también el hueco que le reservaba el centro de la barra.
export default function BarraInferior() {
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const { session } = useAuth()
  const [menuMasAbierto, setMenuMasAbierto] = useState(false)
  const [avisoAbierto, setAvisoAbierto] = useState(false)

  const esAdmin = esAdministrador(session)
  const pestanas = pestanasDeMobile(esAdmin)
  const seccionActiva = seccionActivaDeLaRuta(ubicacion.pathname, esAdmin)

  function mostrarAviso() {
    setAvisoAbierto(true)
  }

  function elegirSeccion(_event, seccion) {
    if (seccion === SECCION_MAS) {
      setMenuMasAbierto(true)
      return
    }

    const elegida = pestanas.find(pestana => pestana.id === seccion)
    if (elegida) {
      navegar(elegida.to)
      return
    }

    // Solo puede caer acá el hueco del QR, que está deshabilitado: si algún día llega otra
    // pestaña sin ruta, el aviso es una respuesta honesta en lugar de un click que no hace nada.
    mostrarAviso()
  }

  return (
    <Paper
      elevation={8}
      // sx como FUNCIÓN y no como objeto: adentro de un objeto sx, una propiedad cuyo valor es una
      // función no se evalúa — MUI la pasa tal cual y el estilo se pierde sin avisar. Es la misma
      // clase de trampa que los props de Stack que este proyecto ya se comió dos veces.
      sx={tema => ({
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: tema.zIndex.appBar,
        pb: 'env(safe-area-inset-bottom)',
        // Vidrio, para que los rayos del fondo se vean pasar también por acá. Más opaca que las
        // tarjetas: está fija y el contenido le desfila por debajo al scrollear, así que con poca
        // opacidad se leería el texto de la página atrás de las etiquetas.
        backgroundColor: tema.palette.superficies.vidrioDeNavegacion,
        // MUI le pone a TODO Paper con `elevation` un degradé blanco encima en modo oscuro
        // (la variable --Paper-overlay). Sobre un fondo traslúcido eso lo vuelve a tapar, así que
        // el vidrio no se veía. Se anula acá y la elevación queda solo como sombra, que es para lo
        // que la queremos: separar la barra del contenido que pasa por debajo.
        backgroundImage: 'none',
        backdropFilter: tema.palette.superficies.difuminado,
        WebkitBackdropFilter: tema.palette.superficies.difuminado
      })}
    >
      <BottomNavigation
        component="nav"
        aria-label="Navegación principal"
        showLabels
        value={seccionActiva}
        onChange={elegirSeccion}
        // MUI les da 80px de ancho mínimo a las acciones: con 5 (contando el hueco del QR)
        // suman 400px y en un teléfono de 360–375px la última ("Más") quedaba cortada. Sin
        // mínimo, se reparten el ancho disponible en partes iguales.
        //
        // Y transparente: BottomNavigation pinta su propio `background.paper`, que es OPACO, encima
        // del Paper de vidrio que la envuelve. Con eso puesto, la barra se veía sólida por más
        // traslúcido que fuera el contenedor. Sin fondo propio, hereda el vidrio y los rayos pasan.
        sx={{
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': { minWidth: 0, px: 0.5 }
        }}
      >
        {/* Las dos primeras pestañas, y después el hueco del QR (solo si hay QR), así el botón
            flotante no tapa ninguna etiqueta. El administrador no tiene hueco, así que sus tres
            pestañas y "Más" se reparten el ancho enteras. */}
        {pestanas.slice(0, 2).map(({ id, etiqueta }) => {
          const Icono = ICONO_POR_SECCION[id]
          return <BottomNavigationAction key={id} label={etiqueta} value={id} icon={<Icono />} />
        })}

        {/* Reserva el lugar del botón de QR para que no tape las etiquetas de los costados. Tiene
            que ser un BottomNavigationAction: BottomNavigation les pasa props propias a todos sus
            hijos, y un Box común las mandaría al HTML y React avisaría del error. */}
        {!esAdmin && (
          <BottomNavigationAction
            value={HUECO_DEL_BOTON_QR}
            disabled
            tabIndex={-1}
            aria-hidden="true"
            sx={{ visibility: 'hidden' }}
          />
        )}

        {pestanas.slice(2).map(({ id, etiqueta }) => {
          const Icono = ICONO_POR_SECCION[id]
          return <BottomNavigationAction key={id} label={etiqueta} value={id} icon={<Icono />} />
        })}

        <BottomNavigationAction label="Más" value={SECCION_MAS} icon={<MoreHorizRounded />} />
      </BottomNavigation>

      {!esAdmin && (
        <Fab
          color="primary"
          aria-label="Escanear código QR"
          onClick={mostrarAviso}
          sx={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)' }}
        >
          <QrCodeScannerRounded />
        </Fab>
      )}

      <MenuMas open={menuMasAbierto} onClose={() => setMenuMasAbierto(false)} />
      <AvisoProximamente open={avisoAbierto} onClose={() => setAvisoAbierto(false)} />
    </Paper>
  )
}
