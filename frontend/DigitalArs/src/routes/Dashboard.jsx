import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import useMiCuenta from "../hooks/useMiCuenta";
import useNavegacionMobile from "../hooks/useNavegacionMobile";
import useOperacionesDeDinero from "../hooks/useOperacionesDeDinero";
import AuthForm, { ProfileFields } from "../components/Auth/AuthForm";
import EstadoDeCargaDeCuenta from "../components/Cuentas/EstadoDeCargaDeCuenta";
import InicioMobile from "../components/Inicio/InicioMobile";
import ModalesDeDinero from "../components/Cuentas/ModalesDeDinero";
import SaldoAnimado from "../components/Cuentas/SaldoAnimado";
import TarjetaVirtual from "../components/Cuentas/TarjetaVirtual";
import { MovimientosPreview } from "./Movimientos";
import { getSessionUser } from "./dashboardUtils";
import { esAdministrador } from "./rolesUtils";

export default function Dashboard() {
  const { session } = useAuth();
  const usuario = getSessionUser(session);
  const esAdmin = esAdministrador(session);
  // El administrador usa el panel de gestión: no tiene cuenta que cargar.
  const { cuenta, cargando, error, reintentar, aplicarDeposito, aplicarTransferencia } =
    useMiCuenta({ habilitado: !esAdmin });
  const operaciones = useOperacionesDeDinero({ aplicarDeposito, aplicarTransferencia });
  const usaNavegacionMobile = useNavegacionMobile();

  // Los modales son los mismos para la vista de escritorio y la mobile: solo cambia el botón
  // que los abre.
  const modalesDeDinero = !esAdmin && cuenta && (
    <ModalesDeDinero operaciones={operaciones} saldoDisponible={cuenta.saldo} />
  );

  // useNavegacionMobile ya deja afuera al administrador: esta rama es solo del usuario regular.
  if (usaNavegacionMobile) {
    return (
      <>
        <InicioMobile
          cuenta={cuenta}
          cargando={cargando}
          error={error}
          onReintentar={reintentar}
          mensajeExito={operaciones.mensajeExito}
          onCerrarMensajeExito={operaciones.cerrarMensajeExito}
          onAgregar={operaciones.abrirDeposito}
          onTransferir={operaciones.abrirTransferencia}
        />
        {modalesDeDinero}
      </>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 3, md: 6 } }}>
      <Typography variant="overline" color="primary">
        Tu espacio
      </Typography>

      <Typography component="h1" variant="h3" fontWeight={700}>
        Hola, {usuario?.nombre ?? "usuario"}
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Bienvenido a tu cuenta de DigitalArs.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="flex-start">
          <Chip label={usuario?.role ?? "Usuario"} />
          <Typography>{usuario?.email ?? "Sin correo disponible"}</Typography>

          {esAdmin ? (
            <>
              <Typography>
                Registrá usuarios: les enviamos un correo para que elijan su
                contraseña.
              </Typography>

              <Button component={Link} to="/usuarios/nuevo" variant="contained">
                Registrar usuario
              </Button>
            </>
          ) : (
            <Box sx={{ width: "100%" }} aria-busy={cargando}>
              <EstadoDeCargaDeCuenta
                cargando={cargando}
                error={error}
                onReintentar={reintentar}
              />

              {!cargando && !error && cuenta && (
                <Stack spacing={2}>
                  <Box>
                    <Typography color="text.secondary">
                      Saldo disponible en pesos
                    </Typography>

                    <SaldoAnimado valor={cuenta.saldo} />
                  </Box>

                  {operaciones.mensajeExito && (
                    <Alert
                      severity="success"
                      onClose={operaciones.cerrarMensajeExito}
                    >
                      {operaciones.mensajeExito}
                    </Alert>
                  )}

                  <Stack direction='row' spacing={2}>
                    <Button variant='contained' onClick={operaciones.abrirDeposito}>
                      Ingresar dinero
                    </Button>

                    <Button variant='outlined' onClick={operaciones.abrirTransferencia}>
                      Transferir dinero
                    </Button>
                  </Stack>

                  <Box>
                    <Typography color="text.secondary">Alias</Typography>
                    <Typography sx={{ overflowWrap: "anywhere" }}>
                      {cuenta.alias}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography color="text.secondary">CVU</Typography>
                    <Typography sx={{ overflowWrap: "anywhere" }}>
                      {cuenta.cvu}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </Paper>
      {/* La tarjeta va antes del historial: es un dato de la cuenta, no una operación.
          Solo para quien tiene billetera, así que el admin no la ve.
          Recibe el saldo porque un pago lo descuenta, y avisa acá para actualizarlo. */}
      {!esAdmin && cuenta && (
        <TarjetaVirtual
          saldoDisponible={cuenta.saldo}
          onPagoRealizado={operaciones.pagoRealizado}
        />
      )}
      {!esAdmin && cuenta && <MovimientosPreview />}
      {modalesDeDinero}
    </Box>
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
