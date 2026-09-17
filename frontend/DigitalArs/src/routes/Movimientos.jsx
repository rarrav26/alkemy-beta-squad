import { useContext, useEffect, useState } from "react";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Alert,
  Box,
  Button,
  Collapse,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { ElementosGlobales } from "../context/ElementosGlobales";
import {
  construirConsulta,
  filtrosIniciales,
  formatearFecha,
  hayFiltrosAplicados,
  normalizarRespuestaMovimientos,
  opcionesTipo,
  paginaVacia,
} from "./movimientosUtils";

const formatoPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

const MILISEGUNDOS_ENTRE_REFRESCOS = 15000;

// Una fila del historial. La usan el preview del dashboard y la pantalla
// completa, asi que el formato de los montos y las fechas es siempre el mismo.
function FilaDeMovimiento({ movimiento }) {
  const signo = movimiento.esCredito ? "+" : "-";
  const color = movimiento.esCredito ? "success.main" : "error.main";
  const IconoMovimiento = movimiento.esCredito
    ? ArrowDownwardRoundedIcon
    : ArrowUpwardRoundedIcon;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, flex: 1, alignItems: "center" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: "50%",
            backgroundColor: movimiento.esCredito ? "success.light" : "error.light",
            color: movimiento.esCredito ? "success.dark" : "error.dark",
            flexShrink: 0,
          }}
        >
          <IconoMovimiento fontSize="small" />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontWeight={700} sx={{ lineHeight: 1.3 }}>
            {movimiento.descripcion}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatearFecha(movimiento.fecha)}
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        <Typography
          fontWeight={700}
          sx={{
            color,
            whiteSpace: "nowrap",
            lineHeight: 1.3,
          }}
        >
          {signo}
          {formatoPesos.format(Math.abs(movimiento.importe))}
        </Typography>
      </Box>
    </Box>
  );
}

// Decide que se ve dentro del recuadro de la lista. Se resuelve con returns
// tempranos para no anidar condiciones dentro del JSX.
function ContenidoDeLaLista({ cargando, movimientos, mensajeSinResultados }) {
  if (cargando) {
    return (
      <Typography color="text.secondary">Cargando movimientos…</Typography>
    );
  }

  if (movimientos.length === 0) {
    return (
      <Typography color="text.secondary">{mensajeSinResultados}</Typography>
    );
  }

  return movimientos.map((movimiento) => (
    <FilaDeMovimiento key={movimiento.id} movimiento={movimiento} />
  ));
}

export function MovimientosPreview() {
  const { obtenerMovimientos } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignorar = false;

    async function pedirUltimosMovimientos() {
      try {
        const respuesta = await obtenerMovimientos({ page: 1, pageSize: 5 });
        if (ignorar) return;

        setMovimientos(normalizarRespuestaMovimientos(respuesta).items);
        setError("");
      } catch (err) {
        if (ignorar) return;
        setError(err.message);
      }
    }

    void pedirUltimosMovimientos();
    const intervalo = window.setInterval(() => {
      void pedirUltimosMovimientos();
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

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={1.5}>
        {movimientos.map((movimiento) => (
          <FilaDeMovimiento key={movimiento.id} movimiento={movimiento} />
        ))}
      </Stack>
    </Paper>
  );
}

export function MovimientosPage() {
  const { obtenerMovimientos } = useAuth();
  const { darkMode } = useContext(ElementosGlobales);
  const theme = useTheme();
  const esPantallaPequena = useMediaQuery(theme.breakpoints.down("md"));
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [datos, setDatos] = useState(paginaVacia);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Se desarman los filtros para que el efecto dependa de tres textos y no de un
  // objeto nuevo en cada render, que lo haria correr de mas.
  const { tipo, desde, hasta, busqueda } = filtros;

  useEffect(() => {
    let ignorar = false;
    const consulta = construirConsulta(
      { tipo, desde, hasta },
      pagina,
      pageSize,
    );

    // mostrarCargando queda en false para el refresco automatico: asi el usuario
    // sigue viendo la lista que ya tenia mientras llega la respuesta nueva.
    async function pedirMovimientos({ mostrarCargando }) {
      if (mostrarCargando) {
        setCargando(true);
      }

      try {
        const respuesta = await obtenerMovimientos(consulta);
        if (ignorar) return;

        setDatos(normalizarRespuestaMovimientos(respuesta));
        setError("");
      } catch (err) {
        if (ignorar) return;
        setError(err.message);
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
  }, [obtenerMovimientos, pagina, pageSize, tipo, desde, hasta]);

  // Cambiar cualquier filtro vuelve a la pagina 1: la pagina en la que estaba el
  // usuario puede no existir en el resultado filtrado.
  function cambiarFiltro(campo, valor) {
    setFiltros((anteriores) => ({ ...anteriores, [campo]: valor }));
    setPagina(1);
  }

  function limpiarFiltros() {
    setFiltros(filtrosIniciales);
    setPagina(1);
  }

  function cambiarTamanioDePagina(valor) {
    setPageSize(Number(valor));
    setPagina(1);
  }

  const filtrosAplicados = hayFiltrosAplicados(filtros);
  const movimientosVisibles = datos.items.filter((movimiento) => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    if (!textoBusqueda) {
      return true;
    }

    const descripcion = (movimiento.descripcion ?? '').toLowerCase();
    const tipo = (movimiento.tipo ?? '').toLowerCase();

    return descripcion.includes(textoBusqueda) || tipo.includes(textoBusqueda);
  });

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

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Box sx={{ width: "100%" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.75, fontSize: "0.78rem", letterSpacing: 0.3 }}
              >
                Buscar
              </Typography>
              <TextField
                fullWidth
                placeholder="Buscar movimientos..."
                size="small"
                value={busqueda}
                onChange={(event) => cambiarFiltro("busqueda", event.target.value)}
                sx={estiloInputCompacto}
              />
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
                  {filtrosAbiertos ? "Ocultar filtros" : "Filtros"}
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

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <ContenidoDeLaLista
              cargando={cargando}
              movimientos={movimientosVisibles}
              mensajeSinResultados={mensajeSinResultados}
            />
          </Stack>
        </Paper>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              disabled={pagina === 1 || cargando}
              onClick={() => setPagina((valor) => valor - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outlined"
              disabled={pagina >= datos.totalPages || cargando}
              onClick={() => setPagina((valor) => valor + 1)}
            >
              Siguiente
            </Button>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
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

            <Typography color="text.secondary">
              Página {pagina} de {datos.totalPages} · {datos.totalItems}{" "}
              movimientos
            </Typography>
          </Stack>
        </Stack>

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

export default MovimientosPage;
