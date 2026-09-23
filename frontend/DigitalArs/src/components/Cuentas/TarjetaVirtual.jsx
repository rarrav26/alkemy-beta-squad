import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useAuth } from "../../context/authContext";
import {
  cambiarCongelamientoTarjeta,
  darDeBajaTarjeta,
  generarTarjeta,
  obtenerMiTarjeta,
  revelarTarjeta,
} from "../../context/api";
import TarjetaVisual from "./TarjetaVisual";
import RevelarCodigoModal from "./RevelarCodigoModal";

// Cuánto se ve el código antes de que la tarjeta se dé vuelta sola. Suficiente para leer tres
// dígitos y copiarlos, no tanto como para dejarlos expuestos si el usuario se va del escritorio.
const SEGUNDOS_VISIBLE = 12;

export default function TarjetaVirtual() {
  const { session } = useAuth();
  const token = session?.token;

  const [tarjeta, setTarjeta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Error de una acción (congelar, generar, dar de baja). Separado del error de carga: un fallo
  // al congelar no puede borrar la tarjeta de la pantalla, que es el bug que ya nos pasó en
  // Perfil con el alias.
  const [errorDeAccion, setErrorDeAccion] = useState("");
  const [accionEnCurso, setAccionEnCurso] = useState(false);

  // El número completo y el código, solo mientras están revelados.
  const [secreto, setSecreto] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  // De qué lado se está mirando la tarjeta. Es estado INDEPENDIENTE del secreto: girar es una
  // acción de ver y no pide contraseña, mientras revelar desbloquea los datos de las dos caras.
  // Antes el giro dependía del secreto, y por eso ver el código escondía el número.
  const [girada, setGirada] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [errorDePassword, setErrorDePassword] = useState("");
  const [verificando, setVerificando] = useState(false);

  const [bajaAbierta, setBajaAbierta] = useState(false);

  // Contador de reintentos: incrementarlo vuelve a disparar el efecto de carga. Es el mismo
  // patrón que usa Dashboard para su botón de reintento.
  const [intento, setIntento] = useState(0);

  // Se guarda en una ref y no en el estado porque el temporizador se cancela desde la limpieza
  // del efecto, donde leer el estado daría el valor viejo.
  const temporizador = useRef(null);

  useEffect(() => {
    if (!token) return;

    const controlador = new AbortController();
    let vivo = true;

    // La carga va dentro de una función async y el primer setState ocurre DESPUÉS del await:
    // llamar a setState de forma sincrónica en el cuerpo de un efecto dispara renders en
    // cascada, y la regla react-hooks/set-state-in-effect lo marca como error.
    async function cargar() {
      try {
        const datos = await obtenerMiTarjeta({ token, signal: controlador.signal });
        // null significa "todavía no generó ninguna", no un error.
        if (vivo) setTarjeta(datos);
      } catch (fallo) {
        if (vivo && fallo.name !== "AbortError") setError(fallo.message);
      } finally {
        if (vivo) setCargando(false);
      }
    }

    cargar();

    return () => {
      vivo = false;
      controlador.abort();
    };
  }, [token, intento]);

  function reintentar() {
    setError("");
    setCargando(true);
    setIntento((valor) => valor + 1);
  }

  // Oculta el código y cancela la cuenta regresiva. Se usa al agotarse el tiempo, al cambiar el
  // estado de la tarjeta y al desmontar.
  const ocultarSecreto = useCallback(() => {
    if (temporizador.current) {
      clearInterval(temporizador.current);
      temporizador.current = null;
    }
    setSecreto(null);
    setSegundosRestantes(0);
  }, []);

  // El código nunca queda visible si el componente se desmonta (el usuario navega a otra
  // página): sin esto, el temporizador seguiría corriendo sobre un componente que ya no existe.
  useEffect(() => ocultarSecreto, [ocultarSecreto]);

  async function confirmarPassword(password) {
    setVerificando(true);
    setErrorDePassword("");

    try {
      const datos = await revelarTarjeta({ token, password });

      setSecreto(datos);
      setModalAbierto(false);
      setSegundosRestantes(SEGUNDOS_VISIBLE);

      // Deliberadamente NO se gira la tarjeta acá. Revelar desbloquea los datos de las dos
      // caras; cuál mirar lo decide el usuario girándola. Girar sola volvería a elegir por él,
      // que era el problema de la versión anterior.
      // Una cuenta regresiva visible y no un simple temporizador escondido: el usuario ve
      // cuánto le queda en vez de que el código desaparezca de golpe.
      temporizador.current = setInterval(() => {
        setSegundosRestantes((quedan) => {
          if (quedan <= 1) {
            ocultarSecreto();
            return 0;
          }
          return quedan - 1;
        });
      }, 1000);
    } catch (fallo) {
      // El modal queda abierto para reintentar. El mensaje del backend ya dice cuántos
      // intentos quedan.
      setErrorDePassword(fallo.message);
    } finally {
      setVerificando(false);
    }
  }

  // Las tres acciones comparten el mismo manejo: bloquear, llamar, refrescar la tarjeta con lo
  // que devolvió el backend, y mostrar el error sin perder la tarjeta de pantalla.
  async function ejecutarAccion(accion) {
    setAccionEnCurso(true);
    setErrorDeAccion("");

    // Cualquier cambio de estado invalida el código revelado: si congelo la tarjeta, el código
    // no puede seguir a la vista.
    ocultarSecreto();

    try {
      const actualizada = await accion();
      setTarjeta(actualizada);
    } catch (fallo) {
      setErrorDeAccion(fallo.message);
    } finally {
      setAccionEnCurso(false);
    }
  }

  const generar = () => ejecutarAccion(() => generarTarjeta({ token }));

  const cambiarCongelamiento = (congelada) =>
    ejecutarAccion(() => cambiarCongelamientoTarjeta({ token, congelada }));

  async function darDeBaja() {
    setBajaAbierta(false);
    await ejecutarAccion(async () => {
      await darDeBajaTarjeta({ token });
      // Después de la baja no hay tarjeta vigente: se vuelve al estado "generá tu tarjeta",
      // que es justamente lo que habilita generar una nueva.
      return null;
    });
  }

  if (cargando) {
    return (
      <Contenedor>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress size={22} />
          <Typography role="status">Cargando tu tarjeta…</Typography>
        </Stack>
      </Contenedor>
    );
  }

  if (error) {
    return (
      <Contenedor>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reintentar}>
              Reintentar
            </Button>
          }
        >
          {error}
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

          {errorDeAccion && (
            <Alert severity="error" onClose={() => setErrorDeAccion("")} sx={{ width: "100%" }}>
              {errorDeAccion}
            </Alert>
          )}

          <Button variant="contained" onClick={generar} disabled={accionEnCurso}>
            {accionEnCurso ? "Generando…" : "Generar tarjeta"}
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
          girada={girada}
          onGirar={() => setGirada((valor) => !valor)}
        />

        {/* Pista de que la tarjeta se puede girar: un elemento accionable que no se ve como un
            botón necesita decirlo, o nadie descubre el gesto. */}
        <Typography variant="caption" color="text.secondary">
          {girada
            ? "Tocá la tarjeta para volver al frente."
            : "Tocá la tarjeta para ver el dorso."}
        </Typography>

        {/* aria-live para que un lector de pantalla anuncie la cuenta regresiva: quien no ve
            la tarjeta girar necesita saber que el código está a la vista y por cuánto. */}
        {secreto && (
          <Typography variant="caption" color="text.secondary" aria-live="polite">
            Los datos se ocultan en {segundosRestantes}s
          </Typography>
        )}

        {errorDeAccion && (
          <Alert severity="error" onClose={() => setErrorDeAccion("")} sx={{ width: "100%" }}>
            {errorDeAccion}
          </Alert>
        )}

        {/* Los tres permisos los decide el backend: el front no deduce la máquina de estados
            por su cuenta. */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", gap: 1, justifyContent: "center" }}
        >
          {tarjeta.puedeRevelarseElCodigo && !secreto && (
            <Button
              variant="contained"
              startIcon={<VisibilityIcon />}
              onClick={() => {
                // El error se limpia acá, al ABRIR, y no al cerrar: limpiarlo al cerrar lo
                // hace desaparecer a la vista durante la animación del diálogo.
                setErrorDePassword("");
                setModalAbierto(true);
              }}
              disabled={accionEnCurso}
            >
              Ver datos
            </Button>
          )}

          {secreto && (
            <Button variant="outlined" onClick={ocultarSecreto}>
              Ocultar datos
            </Button>
          )}

          {tarjeta.puedeCongelarse && (
            <Button
              variant="outlined"
              startIcon={<AcUnitIcon />}
              onClick={() => cambiarCongelamiento(true)}
              disabled={accionEnCurso}
            >
              Congelar
            </Button>
          )}

          {tarjeta.puedeDescongelarse && (
            <Button
              variant="outlined"
              startIcon={<AcUnitIcon />}
              onClick={() => cambiarCongelamiento(false)}
              disabled={accionEnCurso}
            >
              Descongelar
            </Button>
          )}

          <Button
            variant="text"
            color="error"
            startIcon={<DeleteOutlinedIcon />}
            onClick={() => setBajaAbierta(true)}
            disabled={accionEnCurso}
          >
            Dar de baja
          </Button>
        </Stack>

        {tarjeta.estado === "CONGELADA" && (
          <Alert severity="info" sx={{ width: "100%" }}>
            Tu tarjeta está congelada: no permite operaciones ni mostrar el código de
            seguridad. Podés descongelarla cuando quieras.
          </Alert>
        )}

        {tarjeta.estaVencida && (
          <Alert severity="warning" sx={{ width: "100%" }}>
            Tu tarjeta está vencida. Dala de baja y generá una nueva.
          </Alert>
        )}
      </Stack>

      <RevelarCodigoModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onConfirmar={confirmarPassword}
        error={errorDePassword}
        cargando={verificando}
      />

      {/* La baja es irreversible, así que se confirma. El texto dice explícitamente que no se
          puede deshacer, porque "¿estás seguro?" no informa nada. */}
      <Dialog open={bajaAbierta} onClose={() => setBajaAbierta(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Dar de baja la tarjeta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            La tarjeta terminada en {tarjeta.ultimosCuatro} va a quedar inutilizable de forma
            permanente. No se puede reactivar ni descongelar. Después vas a poder generar una
            nueva.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBajaAbierta(false)}>Cancelar</Button>
          <Button onClick={darDeBaja} color="error" variant="contained">
            Dar de baja
          </Button>
        </DialogActions>
      </Dialog>
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
