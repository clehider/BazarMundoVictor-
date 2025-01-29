import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { ref, push, get, set, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

export default function Caja() {
  const { currentUser } = useAuth();
  const [caja, setCaja] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');
  const [abonoMonto, setAbonoMonto] = useState('');
  const [alerta, setAlerta] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    cargarCajaActual();
  }, []);

  const cargarCajaActual = async () => {
    try {
      const cajaRef = ref(db, 'cajas');
      const cajaQuery = query(cajaRef, orderByChild('estado'), equalTo('abierta'));
      const snapshot = await get(cajaQuery);
      
      if (snapshot.exists()) {
        const cajas = [];
        snapshot.forEach((child) => {
          cajas.push({ id: child.key, ...child.val() });
        });
        setCaja(cajas[0]);
        cargarMovimientos(cajas[0].id);
      }
    } catch (error) {
      console.error('Error al cargar caja:', error);
      mostrarAlerta('Error al cargar la caja', 'error');
    }
  };

  const cargarMovimientos = async (cajaId) => {
    try {
      const movimientosRef = ref(db, `movimientos/${cajaId}`);
      const snapshot = await get(movimientosRef);
      
      if (snapshot.exists()) {
        const movimientosArray = [];
        snapshot.forEach((child) => {
          movimientosArray.push({ id: child.key, ...child.val() });
        });
        setMovimientos(movimientosArray);
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    }
  };

  const abrirCaja = async () => {
    try {
      if (!montoInicial || montoInicial <= 0) {
        mostrarAlerta('Ingrese un monto inicial válido', 'error');
        return;
      }

      const nuevaCaja = {
        fechaApertura: new Date().toISOString(),
        montoInicial: parseFloat(montoInicial),
        estado: 'abierta',
        usuarioApertura: currentUser.email,
        totalVentas: 0,
        totalGastos: 0,
        totalAbonos: 0
      };

      const cajaRef = await push(ref(db, 'cajas'), nuevaCaja);
      
      await push(ref(db, `movimientos/${cajaRef.key}`), {
        tipo: 'apertura',
        monto: parseFloat(montoInicial),
        fecha: new Date().toISOString(),
        usuario: currentUser.email,
        descripcion: 'Apertura de caja'
      });

      setOpenDialog(false);
      setMontoInicial('');
      mostrarAlerta('Caja abierta correctamente', 'success');
      cargarCajaActual();
    } catch (error) {
      console.error('Error al abrir caja:', error);
      mostrarAlerta('Error al abrir la caja', 'error');
    }
  };

  const cerrarCaja = async () => {
    try {
      if (!caja) return;

      const totalGeneral = caja.montoInicial + caja.totalVentas + caja.totalAbonos - caja.totalGastos;

      await set(ref(db, `cajas/${caja.id}`), {
        ...caja,
        estado: 'cerrada',
        fechaCierre: new Date().toISOString(),
        usuarioCierre: currentUser.email,
        totalGeneral
      });

      setCaja(null);
      setMovimientos([]);
      mostrarAlerta('Caja cerrada correctamente', 'success');
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      mostrarAlerta('Error al cerrar la caja', 'error');
    }
  };

  const registrarAbono = async () => {
    try {
      if (!caja || !abonoMonto || abonoMonto <= 0) {
        mostrarAlerta('Ingrese un monto válido', 'error');
        return;
      }

      const nuevoAbono = {
        tipo: 'abono',
        monto: parseFloat(abonoMonto),
        fecha: new Date().toISOString(),
        usuario: currentUser.email,
        descripcion: 'Abono a caja'
      };

      await push(ref(db, `movimientos/${caja.id}`), nuevoAbono);
      await set(ref(db, `cajas/${caja.id}/totalAbonos`), caja.totalAbonos + parseFloat(abonoMonto));

      setAbonoMonto('');
      mostrarAlerta('Abono registrado correctamente', 'success');
      cargarCajaActual();
    } catch (error) {
      console.error('Error al registrar abono:', error);
      mostrarAlerta('Error al registrar el abono', 'error');
    }
  };

  const mostrarAlerta = (message, severity) => {
    setAlerta({ show: true, message, severity });
    setTimeout(() => setAlerta({ show: false, message: '', severity: 'success' }), 3000);
  };

  return (
    <Grid container spacing={3}>
      {alerta.show && (
        <Grid item xs={12}>
          <Alert severity={alerta.severity}>{alerta.message}</Alert>
        </Grid>
      )}

      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Caja</Typography>
        {!caja ? (
          <Button
            variant="contained"
            onClick={() => setOpenDialog(true)}
          >
            Abrir Caja
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            onClick={cerrarCaja}
          >
            Cerrar Caja
          </Button>
        )}
      </Grid>

      {caja && (
        <>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Resumen de Caja</Typography>
              <Typography>Monto Inicial: Bs. {caja.montoInicial}</Typography>
              <Typography>Total Ventas: Bs. {caja.totalVentas}</Typography>
              <Typography>Total Gastos: Bs. {caja.totalGastos}</Typography>
              <Typography>Total Abonos: Bs. {caja.totalAbonos}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Total General: Bs. {caja.montoInicial + caja.totalVentas + caja.totalAbonos - caja.totalGastos}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Registrar Abono</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Monto"
                    type="number"
                    value={abonoMonto}
                    onChange={(e) => setAbonoMonto(e.target.value)}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="contained"
                    onClick={registrarAbono}
                    fullWidth
                  >
                    Abonar
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{new Date(mov.fecha).toLocaleString()}</TableCell>
                      <TableCell>{mov.tipo}</TableCell>
                      <TableCell>{mov.descripcion}</TableCell>
                      <TableCell>{mov.usuario}</TableCell>
                      <TableCell align="right">Bs. {mov.monto}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Abrir Caja</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Monto Inicial"
            type="number"
            fullWidth
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={abrirCaja} variant="contained">
            Abrir Caja
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
