import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import useMiCuenta from "../hooks/useMiCuenta";
import useOperacionesDeDinero from "../hooks/useOperacionesDeDinero";
import useShell from "../hooks/useShell";
import AuthForm, { ProfileFields } from "../components/Auth/AuthForm";
import InicioDelAdmin from "../components/Admin/InicioDelAdmin";
import InicioEscritorio from "../components/Inicio/InicioEscritorio";
import InicioMobile from "../components/Inicio/InicioMobile";
import ModalesDeDinero from "../components/Cuentas/ModalesDeDinero";
import { esAdministrador } from "./rolesUtils";
import { SHELL_MOBILE } from "./shellUtils";

export default function Dashboard() {
  const { session } = useAuth();
  const esAdmin = esAdministrador(session);
  // El administrador usa el panel de gestión: no tiene cuenta que cargar.
  const { cuenta, cargando, error, reintentar, aplicarDeposito, aplicarTransferencia } =
    useMiCuenta({ habilitado: !esAdmin });
  const operaciones = useOperacionesDeDinero({ aplicarDeposito, aplicarTransferencia });
  const shell = useShell();

  // El rol decide antes que el ancho: el administrador ve la misma portada del panel en las dos
  // cáscaras, porque lo que cambia entre mobile y escritorio es la navegación que la rodea (barra
  // inferior o barra lateral), no lo que hay adentro. Sus tres acciones caben cómodas en las dos.
  if (esAdmin) return <InicioDelAdmin />;

  // Los modales son los mismos para las dos vistas del usuario regular: solo cambia el botón
  // que los abre.
  const modalesDeDinero = cuenta && (
    <ModalesDeDinero operaciones={operaciones} saldoDisponible={cuenta.saldo} />
  );

  // Las dos vistas reciben exactamente los mismos datos: la cuenta se carga UNA vez acá y cada
  // una decide solo cómo mostrarla. Si cada vista pidiera lo suyo, un arreglo en la carga habría
  // que hacerlo dos veces.
  const datosDeInicio = {
    cuenta,
    cargando,
    error,
    onReintentar: reintentar,
    mensajeExito: operaciones.mensajeExito,
    onCerrarMensajeExito: operaciones.cerrarMensajeExito,
    onAgregar: operaciones.abrirDeposito,
    onTransferir: operaciones.abrirTransferencia,
  };

  // Protected no deja llegar acá sin una sesión verificada, así que lo que no es mobile es
  // escritorio: la cáscara clásica del usuario regular solo existe mientras se verifica, y en
  // ese rato esta pantalla todavía no se dibuja.
  const Inicio = shell === SHELL_MOBILE ? InicioMobile : InicioEscritorio;

  return (
    <>
      <Inicio {...datosDeInicio} />
      {modalesDeDinero}
    </>
  );
}

export function NewUserPage() {
  const { createUser, reenviarInvitacion } = useAuth();
  // El alta ya no trae el código de invitación: viaja solo por correo, así que el
  // administrador nunca lo ve. Acá se guarda a quién se le mandó y si salió.
  const [alta, setAlta] = useState(null);
  const [reenviando, setReenviando] = useState(false);
  const [errorDeReenvio, setErrorDeReenvio] = useState("");

  async function reenviar() {
    setReenviando(true);
    setErrorDeReenvio("");
    try {
      const invitacion = await reenviarInvitacion(alta.usuarioId);
      setAlta({ ...alta, invitationSent: invitacion.invitationSent });
    } catch (error) {
      setErrorDeReenvio(error.message);
    } finally {
      setReenviando(false);
    }
  }

  if (alta)
    return (
      <Box sx={{ maxWidth: 650, mx: "auto", p: 3 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography component="h1" variant="h4">
              Usuario registrado
            </Typography>
            {alta.invitationSent ? (
              <Alert severity="success">
                Se creó la cuenta de {alta.email} y le enviamos un correo con el
                enlace para elegir su contraseña. El enlace vence en 24 horas y
                sirve una sola vez.
              </Alert>
            ) : (
              <Alert severity="warning">
                Se creó la cuenta de {alta.email}, pero no pudimos enviarle el
                correo de invitación. Probá reenviarlo.
              </Alert>
            )}
            {errorDeReenvio && <Alert severity="error">{errorDeReenvio}</Alert>}
            <Button onClick={reenviar} disabled={reenviando}>
              {reenviando ? "Enviando…" : "Reenviar invitación"}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setAlta(null);
                setErrorDeReenvio("");
              }}
            >
              Registrar otro usuario
            </Button>
            <Button component={Link} to="/admin/usuarios">
              Ir al listado de usuarios
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  return (
    <AuthForm
      title="Registrar usuario"
      description="Le vamos a enviar un correo para que elija su contraseña."
      submitLabel="Crear usuario"
      onSubmit={async (data) => setAlta(await createUser(data))}
      footer={
        <Button component={Link} to="/dashboard">
          Volver al dashboard
        </Button>
      }
    >
      <ProfileFields />
    </AuthForm>
  );
}
