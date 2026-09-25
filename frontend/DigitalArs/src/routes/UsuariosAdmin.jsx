import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Pagination,
  CircularProgress,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { obtenerUsuariosAdmin, cambiarEstadoUsuarioAdmin } from '../context/api';
import EditarUsuarioModal from '../components/Admin/EditarUsuarioModal';
import DetalleUsuarioModal from '../components/Admin/DetalleUsuarioModal';
import BotonConfirmarManteniendo from '../components/Comunes/BotonConfirmarManteniendo';

// Las tres acciones. En la tabla van como iconos: ocupan siempre lo mismo, así la fila no se
// reacomoda cuando el rótulo cambia entre "Activar" y "Desactivar", y el texto vive en el
// tooltip. En las tarjetas (teléfono y pantalla mediana) van CON etiqueta visible: en una
// pantalla táctil no hay hover, así que un tooltip nunca aparece y el icono queda sin explicar.
function AccionesUsuario({ usuario, onDetalles, onEditar, onCambiarEstado, conEtiquetas = false }) {
  const activo = Boolean(usuario.isActive);
  const etiquetaEstado = activo ? 'Desactivar' : 'Activar';
  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;

  const acciones = [
    {
      clave: 'detalles',
      etiqueta: 'Detalles',
      descripcion: `Ver detalles de ${nombreCompleto}`,
      color: 'info',
      icono: <VisibilityOutlinedIcon fontSize="small" />,
      alHacerClic: () => onDetalles(usuario)
    },
    {
      clave: 'editar',
      etiqueta: 'Editar',
      descripcion: `Editar datos de ${nombreCompleto}`,
      color: 'primary',
      icono: <EditOutlinedIcon fontSize="small" />,
      alHacerClic: () => onEditar(usuario)
    },
    {
      clave: 'estado',
      etiqueta: etiquetaEstado,
      descripcion: `${etiquetaEstado} a ${nombreCompleto}`,
      color: activo ? 'error' : 'success',
      icono: activo ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlinedIcon fontSize="small" />,
      alHacerClic: () => onCambiarEstado(usuario)
    }
  ];

  if (conEtiquetas) {
    return (
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}
      >
        {acciones.map(accion => (
          <Button
            key={accion.clave}
            size="small"
            color={accion.color}
            startIcon={accion.icono}
            aria-label={accion.descripcion}
            onClick={accion.alHacerClic}
            sx={{ textTransform: 'none', minWidth: 0, px: 1 }}
          >
            {accion.etiqueta}
          </Button>
        ))}
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} sx={{ width: '100%', justifyContent: 'center' }}>
      {acciones.map(accion => (
        <Tooltip key={accion.clave} title={accion.etiqueta}>
          <IconButton
            size="small"
            color={accion.color}
            aria-label={accion.descripcion}
            onClick={accion.alHacerClic}
          >
            {accion.icono}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  );
}

export default function UsuariosAdmin() {
  const { session } = useAuth();
  const theme = useTheme();

  // Las tarjetas cubren teléfono y pantalla mediana (por debajo de 900px), donde la tabla de
  // seis columnas no entra sin apretarse. Desde "md" va la tabla, que aprovecha el ancho.
  const esPantallaChica = useMediaQuery(theme.breakpoints.down('md'));

  // Cuántas columnas tiene la rejilla de tarjetas en este ancho. Hace falta para intercalar
  // bien los fondos: con una columna alcanza alternar por índice, pero con dos eso pintaría
  // cada columna de un color en vez de alternar tarjeta por tarjeta.
  const dosColumnas = useMediaQuery(theme.breakpoints.up('sm'));
  const columnasDeTarjetas = dosColumnas ? 2 : 1;

  const [usuarios, setUsuarios] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [huboPrimeraCarga, setHuboPrimeraCarga] = useState(false);
  const [error, setError] = useState('');

  // Lo que el admin tipea, y el término efectivamente consultado. Se separan para no pegarle
  // a la API en cada tecla: el segundo se actualiza recién cuando deja de escribir.
  const [busqueda, setBusqueda] = useState('');
  const [terminoAplicado, setTerminoAplicado] = useState('');

  // Edición (HU-18), baja/alta lógica (HU-19) y detalle (HU-16): el usuario elegido en cada caso.
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [usuarioIdDetalle, setUsuarioIdDetalle] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  // La visibilidad del diálogo va SEPARADA de su contenido, y a propósito.
  // MUI mantiene el Dialog montado mientras corre su animación de cierre, así que si el
  // contenido se borrara al cerrar, durante esos milisegundos el diálogo se quedaría sin
  // "resultado" y volvería a dibujar la rama de la pregunta -- se veía parpadear la
  // confirmación con sus botones justo después de aceptar. Por eso `contenidoDialogo` no se
  // limpia nunca al cerrar: se reemplaza recién cuando se abre el siguiente.
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [contenidoDialogo, setContenidoDialogo] = useState(null);

  const token = session?.token || session?.accessToken;

  const cargarUsuarios = async (numPagina, termino = '') => {
    setCargando(true);
    setError('');
    try {
      const data = await obtenerUsuariosAdmin({ token, page: numPagina, pageSize: 10, busqueda: termino });

      setUsuarios(data?.items || []);
      // La API responde totalPages (y totalItems). Leer "totalPaginas" devolvía undefined y
      // la paginación quedaba fija en 1 página por más usuarios que hubiera.
      setTotalPaginas(data?.totalPages ?? data?.totalPaginas ?? 1);
      setTotalItems(data?.totalItems ?? 0);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setCargando(false);
      setHuboPrimeraCarga(true);
    }
  };

  useEffect(() => {
    cargarUsuarios(pagina, terminoAplicado);
  }, [pagina, terminoAplicado]);

  // Debounce de la búsqueda: se espera a que el admin pare de tipear antes de consultar, y
  // se vuelve a la página 1 porque el resultado filtrado es una lista distinta.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setTerminoAplicado(busqueda.trim());
      setPagina(1);
    }, 400);

    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const handlePageChange = (event, valor) => {
    setPagina(valor);
  };

  function abrirConfirmacion(usuario) {
    setContenidoDialogo({ usuario, activar: !usuario.isActive });
    setDialogoAbierto(true);
  }

  function cerrarDialogo() {
    setDialogoAbierto(false);
  }

  function verDetalles(usuario) {
    setUsuarioIdDetalle(usuario.usuarioId || usuario.id);
  }

  async function confirmarCambioDeEstado() {
    if (!contenidoDialogo?.usuario || cambiandoEstado) return;

    const { usuario, activar } = contenidoDialogo;
    const id = usuario.usuarioId || usuario.id;

    setCambiandoEstado(true);
    setError('');

    try {
      await cambiarEstadoUsuarioAdmin({ token, id, isActive: activar });

      // Se actualiza la fila en memoria en vez de recargar la página entera: cambió el
      // estado de un usuario, no la lista. Recargar mostraba el spinner de toda la pantalla
      // y repintaba todo por un dato de una sola fila.
      setUsuarios(previos =>
        previos.map(u =>
          (u.usuarioId || u.id) === id ? { ...u, isActive: activar } : u
        )
      );

      // El diálogo NO se cierra: el mismo diálogo pasa a mostrar el resultado adentro, donde
      // el administrador ya está mirando. No aparece ningún otro aviso después.
      setContenidoDialogo(previo => ({
        ...previo,
        resultado: `${usuario.nombre} ${usuario.apellido} quedó ${activar ? 'activado' : 'desactivado'}.`
      }));
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado del usuario.');
      cerrarDialogo();
    } finally {
      setCambiandoEstado(false);
    }
  }

  // Los colores salen del tema (ver ElementosGlobales): acá ya no se decide nada de paleta.
  const colorTextoSecundario = 'text.secondary';

  // Rango visible, para el "Mostrando X–Y de Z".
  const desde = totalItems === 0 ? 0 : (pagina - 1) * 10 + 1;
  const hasta = Math.min(pagina * 10, totalItems);

  return (
    // Contenedor de PURO layout: ancho máximo, centrado y aire. No pinta fondo a propósito.
    // Antes llevaba 'background.default', que es opaco, así que tapaba los rayos en toda la
    // pantalla del admin; y si en cambio le pusiéramos vidrio, quedaría un vidrio encima del
    // vidrio de la tabla -- dos desenfoques apilados y el doble de opacidad efectiva. La única
    // superficie de esta pantalla es la tabla (o las tarjetas).
    <Box
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        p: { xs: 2, md: 4 },
        color: 'text.primary'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: { xs: '1.6rem', md: '2.125rem' } }}>
            Listado de usuarios
          </Typography>
          <Typography variant="body2" sx={{ color: colorTextoSecundario, mt: 0.5 }}>
            Administración de usuarios registrados
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/usuarios/nuevo"
          sx={{ textTransform: 'none', fontWeight: 600, px: 2.5, width: { xs: '100%', sm: 'auto' } }}
        >
          Crear nuevo usuario
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Búsqueda libre. El filtro se resuelve en el backend, así alcanza a todos los
          usuarios y no solo a los diez de la página que está a la vista. */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <TextField
          size="small"
          placeholder="Buscar por nombre, email o documento"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          sx={{ width: { xs: '100%', sm: 360 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: busqueda ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Limpiar búsqueda" onClick={() => setBusqueda('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          }}
        />

        {/* Sin este dato el admin no sabe si está viendo todo o una porción. */}
        {huboPrimeraCarga && (
          <Typography variant="body2" sx={{ color: colorTextoSecundario, whiteSpace: 'nowrap' }}>
            {totalItems === 0
              ? 'Sin resultados'
              : `Mostrando ${desde}–${hasta} de ${totalItems}`}
          </Typography>
        )}
      </Stack>

      {/* El spinner que tapa todo se muestra SOLO en la primera carga. En las recargas
          (cambio de página, búsqueda) la lista se mantiene en pantalla y se atenúa: así no
          desaparece el contenido ni salta el alto de la página en cada consulta. */}
      {cargando && !huboPrimeraCarga ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            opacity: cargando ? 0.5 : 1,
            pointerEvents: cargando ? 'none' : 'auto',
            transition: 'opacity 150ms'
          }}
        >
          {cargando && (
            <CircularProgress
              size={28}
              sx={{ position: 'absolute', top: 8, left: '50%', ml: '-14px', zIndex: 1 }}
            />
          )}
          {usuarios.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" sx={{ color: colorTextoSecundario }}>
                {terminoAplicado
                  ? `No encontramos usuarios que coincidan con "${terminoAplicado}".`
                  : 'No hay usuarios registrados con rol Usuario.'}
              </Typography>
              {terminoAplicado && (
                <Button size="small" sx={{ mt: 1 }} onClick={() => setBusqueda('')}>
                  Limpiar búsqueda
                </Button>
              )}
            </Paper>
          ) : esPantallaChica ? (
            /* Vista de tarjetas. En dos columnas desde "sm": a una sola columna las tarjetas
               quedaban muy anchas y con mucho aire al costado en pantallas medianas. */
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2
              }}
            >
              {usuarios.map((u, indice) => {
                // Tablero de ajedrez: se combina la fila con la columna, así una tarjeta
                // nunca comparte fondo con la de al lado ni con la de arriba. Con una sola
                // columna la fórmula se reduce a alternar por índice.
                const fila = Math.floor(indice / columnasDeTarjetas);
                const columna = indice % columnasDeTarjetas;
                const usaTonoAlterno = (fila + columna) % 2 === 1;

                return (
                <Paper
                  key={u.usuarioId || u.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    // Mismo tinte intercalado que las filas de la tabla, así la lista se lee
                    // igual en las dos vistas. Es un tinte traslúcido que se apoya sobre el
                    // vidrio de la tarjeta, no un fondo que lo reemplaza: con un tono opaco,
                    // la mitad de las tarjetas tapaba los rayos. Y se lee del objeto del tema
                    // en vez de pasar la ruta como texto, porque 'superficies.tinteAlterno' es
                    // una clave propia y sx no la resuelve como sí hace con las de la paleta
                    // estándar -- pasándola como texto el fondo quedaba sin aplicar.
                    backgroundImage: usaTonoAlterno
                      ? `linear-gradient(${theme.palette.superficies.tinteAlterno}, ${theme.palette.superficies.tinteAlterno})`
                      : 'none',
                    boxShadow: 1,
                    // Franja de color al costado: da el estado de un vistazo al recorrer la
                    // lista, antes de leer el chip.
                    borderLeft: '4px solid',
                    borderLeftColor: u.isActive ? 'success.main' : 'text.disabled',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 160ms',
                    '&:hover': { boxShadow: 4 }
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                    {/* Las iniciales llenan el espacio que quedaba vacío y hacen de ancla
                        visual para distinguir una tarjeta de otra al barrer la lista. */}
                    <Avatar
                      sx={{
                        bgcolor: u.isActive ? 'primary.main' : 'action.disabledBackground',
                        color: u.isActive ? 'primary.contrastText' : 'text.secondary',
                        fontWeight: 700,
                        width: 44,
                        height: 44,
                        flexShrink: 0
                      }}
                    >
                      {`${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase()}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        fontWeight={700}
                        noWrap
                        title={`${u.nombre} ${u.apellido}`}
                        sx={{ color: 'text.primary' }}
                      >
                        {u.nombre} {u.apellido}
                      </Typography>
                      <Typography
                        variant="body2"
                        noWrap
                        title={u.email}
                        sx={{ color: colorTextoSecundario }}
                      >
                        {u.email}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="caption" sx={{ color: colorTextoSecundario, display: 'block', mt: 1.5 }}>
                    ID {u.usuarioId || u.id} · {u.tipoDocumento} {u.nroDocumento}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {/* mt:auto empuja el pie al fondo: así las acciones y el estado quedan
                      alineados entre las dos tarjetas de una misma fila aunque una tenga el
                      nombre o el documento más largo. */}
                  <Box sx={{ mt: 'auto' }}>
                    <AccionesUsuario
                      usuario={u}
                      onDetalles={verDetalles}
                      onEditar={setUsuarioAEditar}
                      onCambiarEstado={abrirConfirmacion}
                      conEtiquetas
                    />

                    {/* El estado cierra la tarjeta: es el dato que el administrador va a
                        comparar entre una tarjeta y otra al recorrer la lista. */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                      <Chip
                        label={u.isActive ? 'Activo' : 'Desactivado'}
                        color={u.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                </Paper>
                );
              })}
            </Box>
          ) : (
            /* Vista de tabla para escritorio. `variant="outlined"` no es solo el borde: es lo
               que el tema usa para decidir qué superficie va de vidrio, así que es la línea que
               hace que los rayos se vean cruzar por detrás de la tabla. Sin ella, `component=
               {Paper}` cae en la variante `elevation`, que trae fondo opaco y encima el degradé
               `--Paper-overlay` que MUI agrega en modo oscuro. El contenedor conserva su scroll
               horizontal como red de seguridad en anchos intermedios. */
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ overflowX: 'auto' }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.superficies.encabezadoTabla }}>
                  <TableRow>
                    <TableCell sx={{ color: 'common.white', fontWeight: 700, width: 60 }}>ID</TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 700 }}>Nombre y Apellido</TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 700 }}>Documento</TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 700 }} align="center">Estado</TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 700, width: 150 }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow
                      key={u.usuarioId || u.id}
                      hover
                      sx={{
                        // Filas alternadas: en una tabla de seis columnas ayudan a no perder
                        // el renglón al leer de izquierda a derecha. El tono es un tinte
                        // traslúcido, así que la fila se distingue de su vecina sin tapar los
                        // rayos que pasan por detrás del vidrio del contenedor.
                        '&:nth-of-type(odd)': {
                          backgroundColor: theme.palette.superficies.tinteAlterno
                        },
                        '&:last-child td': { borderBottom: 0 }
                      }}
                    >
                      <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {u.usuarioId || u.id}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>
                        {u.nombre} {u.apellido}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {u.email}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {u.tipoDocumento} {u.nroDocumento}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={u.isActive ? 'Activo' : 'Desactivado'}
                          color={u.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <AccionesUsuario
                          usuario={u}
                          onDetalles={verDetalles}
                          onEditar={setUsuarioAEditar}
                          onCambiarEstado={abrirConfirmacion}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Con una sola página el control no aporta nada y solo agrega ruido. */}
          {totalPaginas > 1 && (
            <Stack sx={{ mt: 3, alignItems: 'center' }}>
              <Pagination
                count={totalPaginas}
                page={pagina}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                siblingCount={esPantallaChica ? 0 : 1}
              />
            </Stack>
          )}
        </Box>
      )}

      <DetalleUsuarioModal
        open={Boolean(usuarioIdDetalle)}
        usuarioId={usuarioIdDetalle}
        token={token}
        onClose={() => setUsuarioIdDetalle(null)}
      />

      <EditarUsuarioModal
        key={usuarioAEditar?.usuarioId || usuarioAEditar?.id || 'sin-usuario'}
        open={Boolean(usuarioAEditar)}
        usuario={usuarioAEditar}
        token={token}
        onClose={() => setUsuarioAEditar(null)}
        onUsuarioActualizado={(actualizado) => {
          const id = actualizado?.usuarioId || actualizado?.id;

          // Igual que el cambio de estado: se refleja la fila editada sin recargar la lista.
          if (id) {
            setUsuarios(previos =>
              previos.map(u => ((u.usuarioId || u.id) === id ? { ...u, ...actualizado } : u))
            );
          }

          setUsuarioAEditar(null);

          // Mismo diálogo de resultado que usa activar/desactivar: un único lugar donde se
          // confirman los cambios, modal, y que solo se cierra con Aceptar.
          setContenidoDialogo({
            titulo: 'Datos actualizados',
            resultado: `Se guardaron los datos de ${actualizado?.nombre || ''} ${actualizado?.apellido || ''}.`.replace(/\s+/g, ' ').trim()
          });
          setDialogoAbierto(true);
        }}
      />

      {/* Activar y desactivar piden confirmación: es una acción sobre el acceso de otra
          persona y se dispara con un solo clic desde la lista. El mismo diálogo tiene dos
          estados -- la pregunta y, una vez hecho el cambio, el resultado -- así el aviso de
          éxito no depende de ningún temporizador ni de que aparezca otro elemento. */}
      <Dialog
        open={dialogoAbierto}
        onClose={() => {
          // Mientras se guarda no se puede cerrar. Con el resultado a la vista, tampoco:
          // la única salida es Aceptar, así el administrador siempre lee qué pasó.
          if (cambiandoEstado || contenidoDialogo?.resultado) return;
          cerrarDialogo();
        }}
        aria-labelledby="confirmar-estado-titulo"
        fullWidth
        maxWidth="xs"
      >
        {contenidoDialogo?.resultado ? (
          <>
            <DialogTitle id="confirmar-estado-titulo">
              {contenidoDialogo.titulo ||
                (contenidoDialogo.activar ? 'Usuario activado' : 'Usuario desactivado')}
            </DialogTitle>
            <DialogContent>
              <Alert severity="success" icon={<CheckCircleOutlinedIcon />}>
                {contenidoDialogo.resultado}
              </Alert>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="contained" onClick={cerrarDialogo} autoFocus>
                Aceptar
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle id="confirmar-estado-titulo">
              {contenidoDialogo?.activar ? '¿Activar usuario?' : '¿Desactivar usuario?'}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                {contenidoDialogo?.activar ? (
                  <>
                    <b>{contenidoDialogo?.usuario?.nombre} {contenidoDialogo?.usuario?.apellido}</b> va a recuperar
                    el acceso y podrá volver a operar con su cuenta.
                  </>
                ) : (
                  <>
                    <b>{contenidoDialogo?.usuario?.nombre} {contenidoDialogo?.usuario?.apellido}</b> no podrá
                    iniciar sesión, ingresar dinero, transferir ni recibir transferencias. No se borra
                    ningún dato: su cuenta y sus movimientos se conservan y podés reactivarlo cuando quieras.
                  </>
                )}
              </DialogContentText>
              {!contenidoDialogo?.activar && (
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  Mantené presionado 2 segundos para desactivar. Si soltás antes, se cancela.
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap', rowGap: 2 }}>
              {/* El foco arranca en Cancelar: es una acción destructiva y quien apreta Enter
                  por reflejo no debería desactivar a nadie sin haberlo leído. */}
              <Button onClick={cerrarDialogo} disabled={cambiandoEstado} autoFocus>
                Cancelar
              </Button>
              {contenidoDialogo?.activar ? <Button
                variant="contained"
                color="success"
                onClick={confirmarCambioDeEstado}
                disabled={cambiandoEstado}
              >
                {cambiandoEstado ? 'Guardando…' : 'Activar'}
              </Button> : dialogoAbierto && (
                <BotonConfirmarManteniendo
                  key={contenidoDialogo?.usuario?.usuarioId || contenidoDialogo?.usuario?.id}
                  onConfirmar={confirmarCambioDeEstado}
                  disabled={cambiandoEstado}
                  icon={<BlockOutlinedIcon fontSize="small" />}
                >
                  Mantener para desactivar
                </BotonConfirmarManteniendo>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
