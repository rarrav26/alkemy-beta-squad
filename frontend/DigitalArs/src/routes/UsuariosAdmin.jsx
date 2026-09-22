import { useEffect, useState, useContext } from 'react';
import {
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
  ButtonGroup,
  Pagination,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/authContext';
import { ElementosGlobales } from '../context/ElementosGlobales';
import { Navigate } from 'react-router-dom';
import { obtenerUsuariosAdmin } from '../context/api';

export default function UsuariosAdmin() {
  const { session } = useAuth();
  const { darkMode } = useContext(ElementosGlobales);

  // Verificamos rol
  const user = session?.user || session?.usuario || session;
  const esAdmin = 
    user?.role === 'Administrador' || 
    user?.rol === 'Administrador' ||
    user?.Role === 'Administrador';

  if (!esAdmin) {
    return <Navigate to="/" replace />;
  }

  const [usuarios, setUsuarios] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarUsuarios = async (numPagina) => {
    setCargando(true);
    setError('');
    try {
      // Pasamos el token que viene en session
      const token = session?.token || session?.accessToken;
      const data = await obtenerUsuariosAdmin({ token, page: numPagina, pageSize: 10 });
      
      setUsuarios(data?.items || []);
      setTotalPaginas(data?.totalPaginas || 1);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios(pagina);
  }, [pagina]);

  const handlePageChange = (event, valor) => {
    setPagina(valor);
  };

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        p: { xs: 2.5, md: 4 },
        backgroundColor: darkMode ? '#0d1117' : '#f8fafc',
        borderRadius: 2,
        color: darkMode ? '#f5f5f5' : '#111827'
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
          <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            Listado de usuarios
          </Typography>
          <Typography variant="body2" sx={{ color: darkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary', mt: 0.5 }}>
            Administración de usuarios registrados
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => console.log('Crear usuario - próxima HU')}
          sx={{ textTransform: 'none', fontWeight: 600, px: 2.5 }}
        >
          Crear nuevo usuario
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cargando ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: darkMode ? '#161b22' : '#ffffff',
              boxShadow: 1,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: darkMode ? '#21262d' : '#1e293b' }}>
                <TableRow>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 60 }}>ID</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Nombre y Apellido</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Documento</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }} align="center">Estado</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No hay usuarios registrados con rol Usuario.
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((u) => (
                    <TableRow key={u.usuarioId || u.id} hover>
                      <TableCell sx={{ color: darkMode ? '#e6edf3' : 'inherit', fontWeight: 500 }}>
                        {u.usuarioId || u.id}
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#e6edf3' : 'inherit', fontWeight: 600 }}>
                        {u.nombre} {u.apellido}
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#e6edf3' : 'inherit' }}>
                        {u.email}
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#e6edf3' : 'inherit' }}>
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
                        <ButtonGroup size="small" variant="outlined" sx={{ textTransform: 'none' }}>
                          <Button
                            color="info"
                            onClick={() => console.log('Detalles usuario ID:', u.usuarioId || u.id)}
                          >
                            Detalles
                          </Button>
                          <Button
                            color="primary"
                            onClick={() => console.log('Editar usuario ID:', u.usuarioId || u.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            color={u.isActive ? 'error' : 'success'}
                            onClick={() => console.log('Toggle estado ID:', u.usuarioId || u.id)}
                          >
                            {u.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Pagination
              count={totalPaginas}
              page={pagina}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
            />
          </Stack>
        </>
      )}
    </Box>
  );
}