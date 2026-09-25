import { useState } from 'react'
import { Box, Button, List, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import NorthEastRounded from '@mui/icons-material/NorthEastRounded'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import TarjetaVisual from '../components/Cuentas/TarjetaVisual'
import FilaDeMovimientoCompacta from '../components/Movimientos/FilaDeMovimientoCompacta'
import './Bienvenida.css'

// Datos exclusivamente ilustrativos; esta portada no consulta cuentas ni movimientos reales.
const TARJETA_DE_MUESTRA = { estado: 'ACTIVA', ultimosCuatro: '2026', titular: 'TU NOMBRE', vencimiento: '09/30' }
const MOVIMIENTOS_DE_MUESTRA = [
  { id: 1, tipoRaw: 'TRANSFERENCIA_RECIBIDA', descripcion: 'Transferencia recibida', contraparte: 'Martina', importe: 24000, esCredito: true, esDebito: false, fecha: '2026-09-25T10:30:00-03:00' },
  { id: 2, tipoRaw: 'PAGO_CON_TARJETA', descripcion: 'Pago con tarjeta', ultimosCuatro: '2026', importe: 4500, esCredito: false, esDebito: true, fecha: '2026-09-25T09:15:00-03:00' },
  { id: 3, tipoRaw: 'DEPOSITO', descripcion: 'Depósito', importe: 85000, esCredito: true, esDebito: false, fecha: '2026-09-24T18:00:00-03:00' },
  { id: 4, tipoRaw: 'TRANSFERENCIA_ENVIADA', descripcion: 'Transferencia enviada', contraparte: 'Lucía', importe: 12800, esCredito: false, esDebito: true, fecha: '2026-09-24T16:00:00-03:00' },
  { id: 5, tipoRaw: 'TRANSFERENCIA_RECIBIDA', descripcion: 'Transferencia recibida', contraparte: 'Nicolás', importe: 18500, esCredito: true, esDebito: false, fecha: '2026-09-23T14:00:00-03:00' }
]
export default function Bienvenida() {
  const [pausado, setPausado] = useState(false)
  const [girada, setGirada] = useState(false)
  return <Box className="hero-portada" sx={theme => ({
    '--hero-acento': theme.palette.primary.main,
    '--hero-panel': theme.palette.mode === 'dark' ? 'rgba(19, 29, 44, .76)' : 'rgba(255,255,255,.86)',
    '--hero-linea': theme.palette.divider,
    '--hero-secundario': theme.palette.text.secondary,
    '--hero-verde': theme.palette.mode === 'dark' ? '#84e7ce' : '#167454',
    '--hero-resplandor': theme.palette.mode === 'dark' ? 'rgba(87,135,244,.18)' : 'rgba(66,116,224,.13)'
  })}>
    <section className="hero-principal" aria-labelledby="hero-titulo">
      <div className="hero-copy">
        <div className="hero-etiqueta"><span /> TU BILLETERA. TU RITMO.</div>
        <Typography component="h1" id="hero-titulo" className="hero-titulo">
          Tu dinero,<br /><span>en movimiento.</span>
        </Typography>
        <p className="hero-descripcion">De ese primer café al próximo gran plan. Transferí, pagá y seguí tus movimientos con DigitalArs.</p>
        <div className="hero-acciones">
          <Button component={Link} to="/register" variant="contained" size="large" endIcon={<ArrowForwardRounded />}
            sx={{ px: 3, py: 1.6, fontWeight: 750, textTransform: 'none', boxShadow: '0 8px 32px rgba(80,150,255,.18)' }}>Crear mi cuenta</Button>
          <Button component={Link} to="/login" size="large" sx={{ px: 2, textTransform: 'none', color: 'text.primary' }}>Ya tengo cuenta <NorthEastRounded sx={{ ml: 1, fontSize: 18 }} /></Button>
        </div>
        <div className="hero-nota"><span className="hero-nota-linea" /> Todo conectado. Todo a mano.</div>
      </div>

      <div className={`hero-escena ${pausado ? 'hero-escena--pausada' : ''}`}>
        <div className="hero-orbita hero-orbita--uno" aria-hidden="true" />
        <div className="hero-orbita hero-orbita--dos" aria-hidden="true" />
        <div className="hero-actividad">
          <div className="hero-actividad-cabecera"><span className="hero-punto" /> MOVIMIENTOS <span className="hero-demo">DEMO</span></div>
          <div className="hero-cinta" aria-label="Ejemplos de movimientos ficticios">
            <div className="hero-cinta-interior">
              <List disablePadding className="hero-grupo">{MOVIMIENTOS_DE_MUESTRA.map(m => <FilaDeMovimientoCompacta key={m.id} movimiento={m} conDivisor />)}</List>
              <List disablePadding className="hero-grupo" aria-hidden="true">{MOVIMIENTOS_DE_MUESTRA.map(m => <FilaDeMovimientoCompacta key={m.id} movimiento={m} conDivisor />)}</List>
            </div>
          </div>
        </div>
        <div className="hero-tarjeta">
          <TarjetaVisual tarjeta={TARJETA_DE_MUESTRA} girada={girada} onGirar={() => setGirada(v => !v)} />
          <span className="hero-tarjeta-nota">Tu tarjeta virtual. Siempre con vos.</span>
        </div>
        <div className="hero-confirmacion" aria-hidden="true"><span>↗</span><div><strong>Un toque. Y listo.</strong><small>Todo desde tu billetera.</small></div></div>
        <div className="hero-controles">
          <span>Tarjeta y movimientos de demostración</span>
          <button type="button" onClick={() => setPausado(v => !v)} aria-pressed={pausado} aria-label={pausado ? 'Reanudar animación' : 'Pausar animación'}>
            {pausado ? <PlayArrowRounded /> : <PauseRounded />}
          </button>
        </div>
      </div>
    </section>
    <section className="hero-beneficios" aria-label="Qué podés hacer con DigitalArs">
      <div><SwapHorizRounded /><span><strong>De tu cuenta a la suya</strong><small>Transferencias por alias o CVU.</small></span></div>
      <div><CreditCardRounded /><span><strong>Tu tarjeta, tus decisiones</strong><small>Gestioná tu tarjeta virtual.</small></span></div>
      <div><ReceiptLongRounded /><span><strong>Cada movimiento, a la vista</strong><small>Consultá tu actividad en un lugar.</small></span></div>
    </section>
  </Box>
}
