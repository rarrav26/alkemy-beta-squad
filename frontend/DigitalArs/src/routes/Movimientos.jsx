import { useContext, useEffect, useState } from "react";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Card,
  CardContent,
  List,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import FilaDeMovimientoCompacta from "../components/Movimientos/FilaDeMovimientoCompacta";
import HistorialMobile from "../components/Movimientos/HistorialMobile";
import { useAuth } from "../context/authContext";
import { ElementosGlobales } from "../context/ElementosGlobales";
import useShell from "../hooks/useShell";
import { SHELL_MOBILE } from "./shellUtils";
import {
  construirConsulta,
  contarFiltrosAplicados,
  filtrosIniciales,
  normalizarRespuestaMovimientos,
  opcionesTipo,
  paginaVacia,
} from "./movimientosUtils";

const MILISEGUNDOS_ENTRE_REFRESCOS = 15000;

// Decide que se ve dentro del recuadro de la lista. Se resuelve con returns
// tempranos para no anidar condiciones dentro del JSX. Lo usan la pantalla
// completa y la card del dashboard, asi las dos muestran los mismos estados.
function ContenidoDeLaLista({
  cargando,
  error,
  movimientos,
  mensajeSinResultados,
}) {
  if (cargando) {
    return (
      <Typography color="text.secondary" role="status" sx={{ py: 2 }}>
        Cargando movimientos…
      </Typography>
    );
  }

  // El error va antes que el vacio: si la lista quedo vacia porque la carga fallo,
  // no sabemos si el usuario tiene movimientos, asi que no lo afirmamos.
  if (error) {
    return <Alert severity="error" sx={{ my: 1.5 }}>{error}</Alert>;
  }

  if (movimientos.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>{mensajeSinResultados}</Typography>
    );
  }

  return (
    <List disablePadding>
      {movimientos.map((movimiento, indice) => (
        <FilaDeMovimientoCompacta
          key={movimiento.id}
          movimiento={movimiento}
          conDivisor={indice < movimientos.length - 1}
        />
      ))}
    </List>
  );
}

export function MovimientosPreview() {
  const { obtenerMovimientos } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let ignorar = false;

    // Igual que en la pantalla completa: un fallo del refresco automatico no pisa
    // lo que ya se esta viendo, solo lo hace un fallo de la carga de primer plano.
    async function pedirUltimosMovimientos({ mostrarCargando }) {
      try {
        const respuesta = await obtenerMovimientos({ page: 1, pageSize: 5 });
        if (ignorar) return;

        setMovimientos(normalizarRespuestaMovimientos(respuesta).items);
        setError("");
      } catch (err) {
        if (ignorar) return;
        if (mostrarCargando) {
          setError(err.message);
        }
      } finally {
        if (!ignorar) {
          setCargando(false);
        }
      }
    }

    void pedirUltimosMovimientos({ mostrarCargando: true });
    const intervalo = window.setInterval(() => {
      void pedirUltimosMovimientos({ mostrarCargando: false });
    }, MILISEGUNDOS_ENTRE_REFRESCOS);

    return () => {
      ignorar = true;
      window.clearInterval(intervalo);
    };
  }, [obtenerMovimientos]);

  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 2, justifyContent: "space-between", alignItems: "flex-end" }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" color="primary">
            Historial
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            Últimos movimientos
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/movimientos"
          variant="text"
          sx={{
            minWidth: 0,
            px: 0,
            alignSelf: "flex-end",
            whiteSpace: "nowrap",
          }}
        >
          Ver todos
        </Button>
      </Stack>

      <Stack spacing={1.5} aria-busy={cargando}>
        <ContenidoDeLaLista
          cargando={cargando}
          error={error}
          movimientos={movimientos}
          mensajeSinResultados="Todavía no tenés movimientos en tu cuenta."
        />
      </Stack>
    </Paper>
  );
}

// El historial de escritorio: filtros en un panel y paginación con Anterior / Siguiente.
function HistorialDeEscritorio() {
  const { obtenerMovimientos } = useAuth();
  const { darkMode } = useContext(ElementosGlobales);
  const theme = useTheme();
  const esPantallaPequena = useMediaQuery(theme.breakpoints.down("md"));
  const [filtros, setFiltros] = useState(filtrosIniciales);
  // Lo que hay escrito en la caja y lo ultimo que se envio son dos cosas: tipear no
  // consulta nada, solo enviar el formulario cambia la busqueda aplicada.
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [datos, setDatos] = useState(paginaVacia);
  const [versionDePagina, setVersionDePagina] = useState(0);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Se desarman los filtros para que el efecto dependa de tres textos y no de un
  // objeto nuevo en cada render, que lo haria correr de mas.
  const { tipo, desde, hasta } = filtros;

  useEffect(() => {
    let ignorar = false;
    const consulta = construirConsulta(
      { tipo, desde, hasta, busqueda: busquedaAplicada },
      pagina,
      pageSize,
    );

    // mostrarCargando queda en false para el refresco automatico: asi el usuario
    // sigue viendo la lista que ya tenia mientras llega la respuesta nueva.
    async function pedirMovimientos({ mostrarCargando }) {
      if (mostrarCargando) {
        setCargando(true);
        setError("");
      }

      try {
        const respuesta = await obtenerMovimientos(consulta);
        if (ignorar) return;

        setDatos(normalizarRespuestaMovimientos(respuesta));
        if (mostrarCargando) setVersionDePagina((version) => version + 1);
        setError("");
      } catch (err) {
        if (ignorar) return;
        setError(err.message);

        // Se descarta el resultado del filtro anterior para no dejarlo en pantalla
        // como si fuera el del filtro nuevo. El refresco automatico no lo hace: un
        // error pasajero de fondo no tiene por que borrar lo que se esta leyendo.
        if (mostrarCargando) {
          setDatos(paginaVacia);
        }
      } finally {
        if (!ignorar) {
          setCargando(false);
        }
      }
    }

    void pedirMovimientos({ mostrarCargando: true });
    const intervalo = window.setInterval(() => {
      void pedirMovimientos({ mostrarCargando: false });
    }, MILISEGUNDOS_ENTRE_REFRESCOS);

    return () => {
      ignorar = true;
      window.clearInterval(intervalo);
    };
  }, [
    obtenerMovimientos,
    pagina,
    pageSize,
    tipo,
    desde,
    hasta,
    busquedaAplicada,
  ]);

  // Cambiar cualquier filtro vuelve a la pagina 1: la pagina en la que estaba el
  // usuario puede no existir en el resultado filtrado.
  function cambiarFiltro(campo, valor) {
    setFiltros((anteriores) => ({ ...anteriores, [campo]: valor }));
    setPagina(1);
  }

  // La busqueda recien viaja al backend cuando se envia el formulario, con Enter o
  // con el boton. Mientras se tipea no se consulta nada.
  function aplicarBusqueda(evento) {
    evento.preventDefault();
    setBusquedaAplicada(busqueda);
    setPagina(1);
  }

  // Limpia tambien la busqueda ya enviada: si solo se vaciara la caja, el filtro
  // seguiria aplicado y no habria forma de entender por que falta la mitad de la lista.
  function limpiarFiltros() {
    setFiltros(filtrosIniciales);
    setBusqueda("");
    setBusquedaAplicada("");
    setPagina(1);
  }

  function cambiarTamanioDePagina(valor) {
    setPageSize(Number(valor));
    setPagina(1);
  }

  // Lo que esta filtrando de verdad. La busqueda cuenta por lo que se envio, no por
  // lo que todavia se esta escribiendo en la caja.
  const filtrosActivos = { tipo, desde, hasta, busqueda: busquedaAplicada };
  const cantidadDeFiltros = contarFiltrosAplicados(filtrosActivos);
  const filtrosAplicados = cantidadDeFiltros > 0;

  // En pantallas chicas los filtros viven detras de este boton. Con el panel cerrado,
  // el numero es la unica pista de que la lista que se ve esta filtrada.
  const etiquetaDelBotonDeFiltros = filtrosAplicados
    ? `Filtros (${cantidadDeFiltros})`
    : "Filtros";

  const mensajeSinResultados = filtrosAplicados
    ? "No hay movimientos que coincidan con los filtros."
    : "Todavía no tenés movimientos en tu cuenta.";

  // El ícono de calendario lo dibuja el propio navegador dentro del input date, y
  // es el que abre el almanaque al hacer clic. En tema oscuro viene negro sobre
  // fondo negro, así que se invierte para que se vea.
  const estiloInputCompacto = {
    "& .MuiOutlinedInput-root": {
      height: 44,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.02)",
      "& fieldset": {
        borderColor: "divider",
      },
      "&:hover fieldset": {
        borderColor: "primary.main",
      },
      "&.Mui-focused fieldset": {
        borderWidth: 1,
      },
    },
    "& .MuiInputBase-input": {
      fontSize: "0.95rem",
    },
  };

  const estiloDeFecha = {
    ...estiloInputCompacto,
    "& input::-webkit-calendar-picker-indicator": {
      filter: darkMode ? "invert(1)" : "none",
      opacity: 0.9,
    },
  };

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", p: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="primary">
            Movimientos
          </Typography>
          <Typography component="h1" variant="h3" fontWeight={700}>
            Historial completo
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            {/* Un form de verdad para que Enter busque sin tener que escuchar teclas. */}
            <Box component="form" onSubmit={aplicarBusqueda} sx={{ width: "100%" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.75, fontSize: "0.78rem", letterSpacing: 0.3 }}
              >
                Buscar
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  placeholder="Buscar por tipo de movimiento..."
                  size="small"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  sx={estiloInputCompacto}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    fontWeight: 700,
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  Buscar
                </Button>
              </Stack>
            </Box>

            {esPantallaPequena ? (
              <Box>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setFiltrosAbiertos((valor) => !valor)}
                  sx={{
                    borderRadius: 999,
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {filtrosAbiertos
                    ? "Ocultar filtros"
                    : etiquetaDelBotonDeFiltros}
                </Button>

                <Collapse in={filtrosAbiertos} unmountOnExit sx={{ mt: 2 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.75 }}
                      >
                        Tipo
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={tipo}
                        onChange={(event) =>
                          cambiarFiltro("tipo", event.target.value)
                        }
                        sx={estiloInputCompacto}
                      >
                        {opcionesTipo.map((opcion) => (
                          <MenuItem key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.75 }}
                      >
                        Desde
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={desde}
                        onChange={(event) =>
                          cambiarFiltro("desde", event.target.value)
                        }
                        sx={estiloDeFecha}
                      />
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.75 }}
                      >
                        Hasta
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={hasta}
                        onChange={(event) =>
                          cambiarFiltro("hasta", event.target.value)
                        }
                        sx={estiloDeFecha}
                      />
                    </Box>
                  </Stack>
                </Collapse>
              </Box>
            ) : (
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.75 }}
                  >
                    Tipo de movimiento
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={tipo}
                    onChange={(event) =>
                      cambiarFiltro("tipo", event.target.value)
                    }
                    sx={estiloInputCompacto}
                  >
                    {opcionesTipo.map((opcion) => (
                      <MenuItem key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.75 }}
                  >
                    Fecha desde
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={desde}
                    onChange={(event) =>
                      cambiarFiltro("desde", event.target.value)
                    }
                    sx={estiloDeFecha}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.75 }}
                  >
                    Fecha hasta
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={hasta}
                    onChange={(event) =>
                      cambiarFiltro("hasta", event.target.value)
                    }
                    sx={estiloDeFecha}
                  />
                </Box>
              </Stack>
            )}

            {filtrosAplicados ? (
              <Button
                variant="text"
                color="inherit"
                onClick={limpiarFiltros}
                sx={{ alignSelf: "flex-start", px: 0 }}
              >
                Limpiar filtros
              </Button>
            ) : null}
          </Stack>
        </Paper>

        <Card variant="outlined">
          <CardContent sx={{ py: 0.5, '&:last-child': { pb: 1.5 } }}>
            <Box
              aria-busy={cargando}
              sx={{ position: "relative", minHeight: (pageSize * 6) + "rem" }}
            >
              {cargando && (
                <LinearProgress
                  aria-label="Cargando movimientos"
                  sx={{ position: "absolute", inset: "0 0 auto", zIndex: 1 }}
                />
              )}
              <Box
                key={versionDePagina}
                aria-hidden={cargando && datos.items.length > 0 ? true : undefined}
                sx={{
                  opacity: cargando ? 0.4 : 1,
                  transition: "opacity 180ms ease",
                  animation: versionDePagina > 0 ? "entradaDeMovimientos 260ms ease-out" : "none",
                  "@keyframes entradaDeMovimientos": {
                    from: { opacity: 0, transform: "translateY(6px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                  // Reserva también las filas vacías de la última página.
                  "& > .MuiList-root": {
                    display: "grid",
                    gridTemplateRows: "repeat(" + pageSize + ", minmax(6rem, auto))",
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    animation: "none",
                    transition: "none",
                  },
                }}
              >
                <ContenidoDeLaLista
                  cargando={cargando && datos.items.length === 0}
                  error={error}
                  movimientos={datos.items}
                  mensajeSinResultados={mensajeSinResultados}
                />
              </Box>
            </Box>

            {/* Sin resultados no hay nada que paginar, y un "Siguiente" habilitado sobre
                una lista vacia solo confunde. */}
            {datos.items.length > 0 ? (
              <Stack
                component="nav"
                aria-label="Paginación de movimientos"
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ justifyContent: "space-between", alignItems: "center", borderTop: 1, borderColor: "divider", mt: 0.5, pt: 2 }}
              >
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="text"
                    size="small"
                    disabled={pagina === 1 || cargando}
                    onClick={() => setPagina((valor) => valor - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    disabled={pagina >= datos.totalPages || cargando}
                    onClick={() => setPagina((valor) => valor + 1)}
                  >
                    Siguiente
                  </Button>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center" }}>
                  <TextField
                    select
                    size="small"
                    label="Por página"
                    value={pageSize}
                    onChange={(event) => cambiarTamanioDePagina(event.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </TextField>

                  <Typography variant="body2" color="text.secondary">
                    Página {pagina} de {datos.totalPages} · {datos.totalItems}{" "}
                    movimientos
                  </Typography>
                </Stack>
              </Stack>
            ) : null}

          </CardContent>
        </Card>

        <Box
          sx={{
            width: { xs: "100%", sm: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", sm: "flex-start" },
          }}
        >
          <Button
            component={Link}
            to="/dashboard"
            variant="contained"
            size="large"
            sx={{
              width: { xs: "100%", sm: "auto" },
              minWidth: { xs: 0, sm: 200 },
              borderRadius: 999,
              px: { xs: 2.5, sm: 3 },
              py: 1.25,
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            Volver al dashboard
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

// Una vista por componente, y no un if en el medio de una sola: cada una tiene sus propios
// hooks (la de escritorio consulta cada 15 s), y así la que no se ve no corre nada.
//
// La de escritorio sirve a las dos cáscaras de pantalla ancha: la de la barra lateral y la
// clásica del administrador.
export function MovimientosPage() {
  const esVistaMobile = useShell() === SHELL_MOBILE;

  if (esVistaMobile) return <HistorialMobile />;

  return <HistorialDeEscritorio />;
}

export default MovimientosPage;
