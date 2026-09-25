import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import useMiTarjeta from "../../hooks/useMiTarjeta";
import TarjetaVisual from "./TarjetaVisual";
import RevelarCodigoModal from "./RevelarCodigoModal";
import PagarConTarjetaModal from "./PagarConTarjetaModal";
import ConfirmarBajaDeTarjetaDialog from "./ConfirmarBajaDeTarjetaDialog";

// La tarjeta virtual en el Dashboard de escritorio. Todo el comportamiento (cargar, revelar,
// congelar, dar de baja, pagar) vive en useMiTarjeta, que comparte con la pantalla Tarjetas de
// mobile: acá solo se decide cómo se ve.
export default function TarjetaVirtual({ saldoDisponible = 0, onPagoRealizado }) {
  const tarjetaDelUsuario = useMiTarjeta({ onPagoRealizado });
  const { tarjeta, secreto } = tarjetaDelUsuario;

  if (tarjetaDelUsuario.cargando) {
    return (
      <Contenedor>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress size={22} />
          <Typography role="status">Cargando tu tarjeta…</Typography>
        </Stack>
      </Contenedor>
    );
  }

  if (tarjetaDelUsuario.error) {
    return (
      <Contenedor>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={tarjetaDelUsuario.reintentar}>
              Reintentar
            </Button>
          }
        >
          {tarjetaDelUsuario.error}
        </Alert>
      </Contenedor>
    );
  }

  // Todavía no generó ninguna, o acaba de dar de baja la que tenía.
  if (!tarjeta) {
    return (
      <Contenedor>
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography color="text.secondary">
            Generá tu tarjeta virtual para tener un medio de pago asociado a tu cuenta.
          </Typography>

          {tarjetaDelUsuario.errorDeAccion && (
            <Alert
              severity="error"
              onClose={tarjetaDelUsuario.limpiarErrorDeAccion}
              sx={{ width: "100%" }}
            >
              {tarjetaDelUsuario.errorDeAccion}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={tarjetaDelUsuario.generar}
            disabled={tarjetaDelUsuario.accionEnCurso}
          >
            {tarjetaDelUsuario.accionEnCurso ? "Generando…" : "Generar tarjeta"}
          </Button>
        </Stack>
      </Contenedor>
    );
  }

  return (
    <Contenedor>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <TarjetaVisual
          tarjeta={tarjeta}
          secreto={secreto}
          girada={tarjetaDelUsuario.girada}
          onGirar={tarjetaDelUsuario.girar}
        />

        {/* Pista de que la tarjeta se puede girar: un elemento accionable que no se ve como un
            botón necesita decirlo, o nadie descubre el gesto. */}
        <Typography variant="caption" color="text.secondary">
          {tarjetaDelUsuario.girada
            ? "Tocá la tarjeta para volver al frente."
            : "Tocá la tarjeta para ver el dorso."}
        </Typography>

        {/* aria-live para que un lector de pantalla anuncie la cuenta regresiva: quien no ve
            la tarjeta girar necesita saber que el código está a la vista y por cuánto. */}
        {secreto && (
          <Typography variant="caption" color="text.secondary" aria-live="polite">
            Los datos se ocultan en {tarjetaDelUsuario.segundosRestantes}s
          </Typography>
        )}

        {tarjetaDelUsuario.errorDeAccion && (
          <Alert
            severity="error"
            onClose={tarjetaDelUsuario.limpiarErrorDeAccion}
            sx={{ width: "100%" }}
          >
            {tarjetaDelUsuario.errorDeAccion}
          </Alert>
        )}

        {/* Los permisos los decide el backend: el front no deduce la máquina de estados por su
            cuenta. */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", gap: 1, justifyContent: "center" }}
        >
          {/* Se esconde el botón en vez de mostrarlo deshabilitado porque el estado ya está
              explicado en el cartel de abajo. */}
          {tarjetaDelUsuario.puedePagar && (
            <Button
              variant="contained"
              startIcon={<ShoppingCartOutlinedIcon />}
              onClick={tarjetaDelUsuario.abrirPago}
              disabled={tarjetaDelUsuario.accionEnCurso}
            >
              Pagar
            </Button>
          )}

          {tarjeta.puedeRevelarseElCodigo && !secreto && (
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={tarjetaDelUsuario.abrirRevelar}
              disabled={tarjetaDelUsuario.accionEnCurso}
            >
              Ver datos
            </Button>
          )}

          {secreto && (
            <Button variant="outlined" onClick={tarjetaDelUsuario.ocultarSecreto}>
              Ocultar datos
            </Button>
          )}

          {tarjeta.puedeCongelarse && (
            <Button
              variant="outlined"
              startIcon={<AcUnitIcon />}
              onClick={tarjetaDelUsuario.congelar}
              disabled={tarjetaDelUsuario.accionEnCurso}
            >
              Congelar
            </Button>
          )}

          {tarjeta.puedeDescongelarse && (
            <Button
              variant="outlined"
              startIcon={<AcUnitIcon />}
              onClick={tarjetaDelUsuario.descongelar}
              disabled={tarjetaDelUsuario.accionEnCurso}
            >
              Descongelar
            </Button>
          )}

          <Button
            variant="text"
            color="error"
            startIcon={<DeleteOutlinedIcon />}
            onClick={tarjetaDelUsuario.abrirBaja}
            disabled={tarjetaDelUsuario.accionEnCurso}
          >
            Dar de baja
          </Button>
        </Stack>

        {tarjeta.estado === "CONGELADA" && (
          <Alert severity="info" sx={{ width: "100%" }}>
            Tu tarjeta está congelada: no permite pagar ni mostrar el código de seguridad.
            Podés descongelarla cuando quieras.
          </Alert>
        )}

        {tarjeta.estaVencida && (
          <Alert severity="warning" sx={{ width: "100%" }}>
            Tu tarjeta está vencida. Dala de baja y generá una nueva.
          </Alert>
        )}
      </Stack>

      <RevelarCodigoModal
        open={tarjetaDelUsuario.revelarAbierto}
        onClose={tarjetaDelUsuario.cerrarRevelar}
        onConfirmar={tarjetaDelUsuario.confirmarPassword}
        error={tarjetaDelUsuario.errorDePassword}
        cargando={tarjetaDelUsuario.verificando}
      />

      <PagarConTarjetaModal
        open={tarjetaDelUsuario.pagoAbierto}
        onClose={tarjetaDelUsuario.cerrarPago}
        onConfirmar={tarjetaDelUsuario.pagar}
        saldoDisponible={saldoDisponible}
        comprobante={tarjetaDelUsuario.comprobante}
        error={tarjetaDelUsuario.errorDePago}
        cargando={tarjetaDelUsuario.pagando}
      />

      <ConfirmarBajaDeTarjetaDialog
        open={tarjetaDelUsuario.bajaAbierta}
        onClose={tarjetaDelUsuario.cerrarBaja}
        onConfirmar={tarjetaDelUsuario.darDeBaja}
        ultimosCuatro={tarjeta.ultimosCuatro}
      />
    </Contenedor>
  );
}

// Los colores salen del tema y no están escritos a mano: es la misma decisión que tomamos en
// UsuariosAdmin y Perfil.
function Contenedor({ children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        mt: 3,
        width: "100%",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Typography variant="overline" color="primary">
        Tu tarjeta
      </Typography>
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Paper>
  );
}
