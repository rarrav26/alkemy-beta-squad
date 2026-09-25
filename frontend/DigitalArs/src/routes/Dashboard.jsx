import { useState, useEffect } from "react";
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
import { useNotificaciones } from "../context/notificacionesContext";
import AuthForm, { ProfileFields } from "../components/Auth/AuthForm";
import DepositoModal from "../components/Cuentas/DepositoModal";
import SaldoAnimado from "../components/Cuentas/SaldoAnimado";
import TransferenciaModal from "../components/Cuentas/TransferenciaModal";
import { MovimientosPreview } from "./Movimientos";
import { getSessionUser } from "./dashboardUtils";
import { esAdministrador } from "./rolesUtils";

export default function Dashboard() {
  const { session, obtenerMiCuenta } = useAuth();
  const { avisosRecibidos } = useNotificaciones();
  const usuario = getSessionUser(session);
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [depositoAbierto, setDepositoAbierto] = useState(false);
  const [transferenciaAbierta, setTransferenciaAbierta] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  const esAdmin = esAdministrador(session);

  useEffect(() => {
    // El administrador usa el panel de gestión.
    if (esAdmin) return;

    const controller = new AbortController();

    async function cargarCuenta() {
      setCargando(true);
      setError("");
      setCuenta(null);

      try {
        const datos = await obtenerMiCuenta(controller.signal);

        if (!controller.signal.aborted) {
          setCuenta(datos);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const mensajeCrudo = (error.message || '').trim()
          const frasesUnicas = [
            ...new Set(
              mensajeCrudo
                .split('.')
                .map(frase => frase.trim())
                .filter(Boolean)
            )
          ]
          const mensajeNormalizado =
            frasesUnicas.length > 0 ? `${frasesUnicas.join('. ')}.` : mensajeCrudo

          setError(mensajeNormalizado)
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarCuenta();

    return () => controller.abort();
  }, [obtenerMiCuenta, esAdmin, intento]);

  // Cuando entra dinero, el mensaje del socket trae la notificación, no el saldo: hay que volver
  // a pedirlo. Va en un efecto aparte y NO reusa el contador "intento" de arriba, porque ese
  // efecto pone la cuenta en null y la tarjeta mostraría "Cargando tu cuenta…" cada vez que
  // llega una transferencia. Acá el saldo se cambia sin que se note el reemplazo.
  useEffect(() => {
    if (esAdmin || avisosRecibidos === 0) return;

    const controller = new AbortController();

    obtenerMiCuenta(controller.signal)
      .then((datos) => {
        if (!controller.signal.aborted) setCuenta(datos);
      })
      // Si el refresco de fondo falla, se deja el saldo anterior en pantalla: es preferible a
      // romper la tarjeta por algo que el usuario no pidió.
      .catch(() => {});

    return () => controller.abort();
  }, [avisosRecibidos, esAdmin, obtenerMiCuenta]);

  function depositoRealizado(resultado) {
    setCuenta((actual) =>
      actual ? { ...actual, saldo: resultado.saldoActual } : actual,
    );

    setMensajeExito(resultado.message);
  }

  function transferenciaRealizada(resultado) {
    setCuenta(actual => {
      if (!actual) return actual
      const nuevoSaldo =
        resultado?.saldoActual !== undefined
          ? resultado.saldoActual
          : actual.saldo - (resultado?.importe || 0)
      return { ...actual, saldo: nuevoSaldo }
    })
    setMensajeExito(resultado?.message || 'Transferencia realizada con éxito.')
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
              {cargando && (
                <Typography role="status">Cargando tu cuenta…</Typography>
              )}

              {!cargando && error && (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => setIntento((valor) => valor + 1)}
                    >
                      Reintentar
                    </Button>
                  }
                >
                  {error}
                </Alert>
              )}

              {!cargando && !error && cuenta && (
                <Stack spacing={2}>
                  <Box>
                    <Typography color="text.secondary">
                      Saldo disponible en pesos
                    </Typography>

                    <SaldoAnimado valor={cuenta.saldo} />
                  </Box>

                  {mensajeExito && (
                    <Alert
                      severity="success"
                      onClose={() => setMensajeExito("")}
                    >
                      {mensajeExito}
                    </Alert>
                  )}

                  <Stack direction='row' spacing={2}>
                    <Button
                      variant='contained'
                      onClick={() => {
                        setMensajeExito('')
                        setDepositoAbierto(true)
                      }}
                    >
                      Ingresar dinero
                    </Button>

                    <Button
                      variant='outlined'
                      onClick={() => {
                        setMensajeExito('')
                        setTransferenciaAbierta(true)
                      }}
                    >
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
      {!esAdmin && cuenta && <MovimientosPreview />}
      {!esAdmin && cuenta && (
        <>
          <DepositoModal
            open={depositoAbierto}
            onClose={() => setDepositoAbierto(false)}
            onDepositoRealizado={depositoRealizado}
          />
          <TransferenciaModal
            open={transferenciaAbierta}
            onClose={() => setTransferenciaAbierta(false)}
            saldoDisponible={cuenta.saldo}
            onTransferenciaRealizada={transferenciaRealizada}
          />
        </>
      )}
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
