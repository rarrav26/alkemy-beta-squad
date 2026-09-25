import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/authContext";

/**
 * Pago con la tarjeta, con el MISMO flujo de dos pasos que una transferencia:
 *
 *   1. se escribe el alias o CVU y se busca  ->  el backend confirma quién es el titular
 *   2. recién entonces se habilitan el importe y el concepto
 *
 * Confirmar el titular ANTES de poner el importe es lo que evita mandarle plata a la cuenta
 * equivocada por un alias mal tipeado: el usuario ve el nombre de quien va a cobrar.
 *
 * Reusa resolverDestinoDeTransferencia, el mismo endpoint que usa TransferenciaModal: valida el
 * destino sin ejecutar nada, así que no hacía falta un endpoint propio para tarjetas.
 */
export default function PagarConTarjetaModal({
  open,
  onClose,
  onConfirmar,
  saldoDisponible,
  comprobante = null,
  error = "",
  cargando = false,
}) {
  const { resolverDestinoDeTransferencia } = useAuth();

  const [destino, setDestino] = useState("");
  // Mientras es null, el paso 2 no existe. Es lo que ordena el flujo.
  const [cuentaDestino, setCuentaDestino] = useState(null);
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState("");

  const [buscando, setBuscando] = useState(false);
  const [errorDeDestino, setErrorDeDestino] = useState("");

  const importeNumerico = Number(importe);
  const importeValido =
    importe !== "" && Number.isFinite(importeNumerico) && importeNumerico > 0;
  const alcanzaElSaldo = importeValido && importeNumerico <= saldoDisponible;
  const puedePagar = Boolean(cuentaDestino) && importeValido && alcanzaElSaldo && !cargando;

  // Paso 1: resolver el destino contra el backend.
  async function buscarDestino() {
    const termino = destino.trim();
    if (!termino) return;

    setBuscando(true);
    setErrorDeDestino("");
    setCuentaDestino(null);

    try {
      const datos = await resolverDestinoDeTransferencia(termino);
      setCuentaDestino(datos);
    } catch (fallo) {
      setErrorDeDestino(fallo.message || "No se encontró la cuenta destino.");
    } finally {
      setBuscando(false);
    }
  }

  // Paso 2: pagar. El destino ya está confirmado.
  function confirmar(evento) {
    evento.preventDefault();
    if (!puedePagar) return;
    onConfirmar({
      destino: destino.trim().toLowerCase(),
      importe: importeNumerico,
      concepto: concepto.trim() || null,
    });
  }

  function cerrar() {
    // No se limpian los errores que vienen por prop: MUI mantiene el Dialog montado durante la
    // animación de cierre, así que limpiarlos acá los haría desaparecer a la vista. Los limpia
    // el contenedor al reabrir.
    setDestino("");
    setCuentaDestino(null);
    setImporte("");
    setConcepto("");
    setErrorDeDestino("");
    onClose();
  }

  // Pago confirmado: se muestra el comprobante en lugar del formulario.
  if (comprobante) {
    return (
      <Dialog open={open} onClose={cerrar} fullWidth maxWidth="xs">
        <DialogTitle>Pago realizado</DialogTitle>

        <DialogContent>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Importe
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                ${comprobante.importe.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </Box>

            <Divider />

            <DatoDelComprobante etiqueta="Pagaste a" valor={comprobante.titular} />
            <DatoDelComprobante etiqueta="Destino" valor={comprobante.destino} />
            <DatoDelComprobante
              etiqueta="Tarjeta"
              valor={`•••• ${comprobante.ultimosCuatro}`}
            />
            {comprobante.concepto && (
              <DatoDelComprobante etiqueta="Concepto" valor={comprobante.concepto} />
            )}
            {/* El número de operación es lo que el usuario anota o del que saca captura, así que
                va en monoespaciada para que se lea dígito por dígito. */}
            <DatoDelComprobante
              etiqueta="Número de operación"
              valor={comprobante.numeroDeOperacion}
              monoespaciada
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrar} variant="contained">
            Listo
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={cerrar} fullWidth maxWidth="xs">
      <form onSubmit={confirmar}>
        <DialogTitle>Pagar con tu tarjeta</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {errorDeDestino && <Alert severity="error">{errorDeDestino}</Alert>}

            {/* PASO 1: destino, con el mismo par campo + botón que la transferencia. */}
            <Stack direction="row" spacing={1}>
              <TextField
                autoFocus
                fullWidth
                label="Alias o CVU de destino"
                value={destino}
                // Se bloquea una vez confirmado: cambiarlo sin volver a buscar dejaría el
                // titular en pantalla sin corresponder al destino escrito.
                disabled={cargando || buscando || Boolean(cuentaDestino)}
                onChange={(evento) => {
                  setDestino(evento.target.value);
                  setErrorDeDestino("");
                }}
              />

              {!cuentaDestino ? (
                <Button
                  // type="button" y no submit: sin esto, Enter en el campo dispararía el pago
                  // en lugar de la búsqueda.
                  type="button"
                  variant="outlined"
                  onClick={buscarDestino}
                  disabled={buscando || !destino.trim() || cargando}
                  sx={{ minWidth: "95px" }}
                >
                  {buscando ? <CircularProgress size={22} /> : "Buscar"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="text"
                  color="secondary"
                  disabled={cargando}
                  onClick={() => {
                    setCuentaDestino(null);
                    setImporte("");
                  }}
                >
                  Cambiar
                </Button>
              )}
            </Stack>

            {/* El titular confirmado por el backend. Es el punto de todo el paso 1. */}
            {cuentaDestino && (
              <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Le vas a pagar a:
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {cuentaDestino.titular || "Destino verificado"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CVU/Alias: {cuentaDestino.cvu || cuentaDestino.alias || destino}
                </Typography>
              </Box>
            )}

            {/* PASO 2: se habilita únicamente con el destino confirmado. */}
            {cuentaDestino && (
              <>
                <Divider />

                <Typography variant="body2" color="text.secondary">
                  Saldo disponible:{" "}
                  <b>
                    ${saldoDisponible.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </b>
                </Typography>

                <TextField
                  autoFocus
                  fullWidth
                  label="Importe a pagar"
                  type="number"
                  value={importe}
                  disabled={cargando}
                  onChange={(evento) => setImporte(evento.target.value)}
                  // step permite centavos; sin esto el navegador rechaza los decimales.
                  slotProps={{
                    htmlInput: { min: 0, step: "0.01" },
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    },
                  }}
                  error={importe !== "" && (!importeValido || !alcanzaElSaldo)}
                  helperText={
                    importe !== "" && !importeValido
                      ? "Ingresá un importe mayor a cero."
                      : importe !== "" && !alcanzaElSaldo
                        ? "No te alcanza el saldo para este pago."
                        : "Mayor a cero, con hasta 2 decimales. Ej.: 500,50"
                  }
                />

                <TextField
                  fullWidth
                  label="Motivo (opcional)"
                  value={concepto}
                  disabled={cargando}
                  onChange={(evento) => setConcepto(evento.target.value)}
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                  helperText="Queda guardado en el aviso, para los dos."
                />
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={!puedePagar}>
            {cargando ? "Pagando…" : "Pagar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function DatoDelComprobante({ etiqueta, valor, monoespaciada = false }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
      <Typography variant="body2" color="text.secondary">
        {etiqueta}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{
          textAlign: "right",
          overflowWrap: "anywhere",
          ...(monoespaciada ? { fontFamily: "monospace" } : {}),
        }}
      >
        {valor}
      </Typography>
    </Stack>
  );
}
