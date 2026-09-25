import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";

/**
 * Pide la contraseña antes de mostrar el código de seguridad.
 *
 * No guarda la contraseña ni la deja en el estado después de usarla: se la pasa a quien
 * confirma y se limpia el campo.
 *
 * El componente no llama a la API: recibe onConfirmar y deja que el contenedor decida qué
 * hacer. Así la lógica de reintentos y bloqueo vive en un solo lugar.
 */
export default function RevelarCodigoModal({
  open,
  onClose,
  onConfirmar,
  error = "",
  cargando = false,
}) {
  const [password, setPassword] = useState("");

  function confirmar(evento) {
    evento.preventDefault();
    if (!password || cargando) return;
    onConfirmar(password);
    // Se limpia acá y no al cerrar: si la contraseña estuvo mal, el modal sigue abierto y el
    // campo tiene que quedar vacío para el siguiente intento.
    setPassword("");
  }

  function cerrar() {
    // Deliberadamente NO se limpia el error acá. MUI mantiene el Dialog montado durante la
    // animación de cierre (~225 ms), así que limpiar el contenido en este punto hace que el
    // contenido cambie a la vista mientras se desvanece. Lo limpia el contenedor al reabrir.
    setPassword("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={cerrar} fullWidth maxWidth="xs">
      {/* form y no solo un botón: así Enter confirma, que es lo que se espera en un campo
          de contraseña. */}
      <form onSubmit={confirmar}>
        <DialogTitle>Ver los datos de la tarjeta</DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Por seguridad, ingresá tu contraseña para ver el número completo y el código de
            seguridad.
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            fullWidth
            autoFocus
            // Le dice al gestor de contraseñas que es la contraseña actual y no una nueva,
            // así no ofrece guardar una contraseña nueva.
            autoComplete="current-password"
            disabled={cargando}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!password || cargando}
          >
            {cargando ? "Verificando…" : "Ver datos"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
