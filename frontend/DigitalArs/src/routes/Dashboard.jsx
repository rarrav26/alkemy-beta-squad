import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  TextField,
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
                Registrá usuarios y entregales una invitación para que elijan su
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
      {!esAdmin && cuenta && <MovimientosPreview />}
      {modalesDeDinero}
    </Box>
  );
}

export function NewUserPage() {
  const { createUser } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");
  if (invitation)
    return (
      <Box sx={{ maxWidth: 650, mx: "auto", p: 3 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography component="h1" variant="h4">
              Usuario registrado
            </Typography>
            <Alert severity="success">
              Se creó la cuenta de {invitation.email}. Todavía debe elegir su
              contraseña.
            </Alert>
            <Typography>
              Entregale este código por un medio privado. Vence en 24 horas y se
              usa una sola vez.
            </Typography>
            <TextField
              label="Código de invitación"
              value={invitation.invitationToken}
              multiline
              minRows={3}
              slotProps={{ input: { readOnly: true } }}
            />
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    invitation.invitationToken,
                  );
                  setCopyMessage("Código copiado.");
                } catch {
                  setCopyMessage("Seleccioná el código y copialo manualmente.");
                }
              }}
            >
              Copiar código
            </Button>
            {copyMessage && <Alert severity="info">{copyMessage}</Alert>}
            <Typography>
              Debe entrar a {window.location.origin}/primera-password con su
              correo y este código.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setInvitation(null);
                setCopyMessage("");
              }}
            >
              Registrar otro usuario
            </Button>
            <Button component={Link} to="/dashboard">
              Volver al dashboard
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  return (
    <AuthForm
      title="Registrar usuario"
      description="El usuario establecerá su contraseña mediante una invitación."
      submitLabel="Crear usuario"
      onSubmit={async (data) => setInvitation(await createUser(data))}
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
