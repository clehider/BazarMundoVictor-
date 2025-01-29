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
import { ref, push, get, query, orderByChild, equalTo, set } from 'firebase/database';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

export default function Gastos() {
  const { currentUser } = useAuth();
  const [gastos, setGastos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [caja, setCaja] = useState(null);
  const [gasto, setGasto] = useState({
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString()
  });
  const [alerta, setAlerta] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    cargarCajaActual();
    cargarGastos();
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
      }
    } catch (error) {
      console.error('Error al cargar caja:', error);
      mostrarAlerta('Error al cargar la caja', 'error');
    }
  };

  const cargarGastos = async () => {
    try {
      const gastosRef = ref(db, 'gastos');
      const snapshot = await get(gastosRef);
      
      if (snapshot.exists()) {
        const gastosArray = [];
        snapshot.forEach((child) => {
          gastosArray.push({ id: child.key, ...child.val() });
        });
        setGastos(gastosArray);
      }
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      mostrarAlerta('Error al cargar los gastos', 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!caja) {
        mostrarAlerta('No hay una caja abierta', 'error');
        return;
      }

      if (!gasto.descripcion || !gasto.monto || gasto.monto <= 0) {
        mostrarAlerta('Complete todos los campos', 'error');
        return;
      }

      const nuevoGasto = {
        ...gasto,
        cajaId: caja.id,
        usuario: currentUser.email,
        fecha: new Date().toISOString(),
        monto: parseFloat(gasto.monto)
      };

      await push(ref(db, 'gastos'), nuevoGasto);
      
      // Registrar movimiento en caja
      await push(ref(db, `movimientos/${caja.id}`), {
        tipo: 'gasto',
        monto: parseFloat(gasto.monto),
        fecha: new Date().toISOString(),
        usuario: currentUser.email,
        descripcion: gasto.descripcion
      });

      // Actualizar total de gastos en caja
      await set(ref(db, `cajas/${caja.id}/totalGastos`), caja.totalGastos + parseFloat(gasto.monto));

      setOpenDialog(false);
      setGasto({
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString()
      });
      mostrarAlerta('Gasto registrado correctamente', 'success');
      cargarGastos();
      cargarCajaActual();
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al registrar el gasto', 'error');
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
        <Typography variant="h4">Gastos</Typography>
        <Button
          variant="contained"
          onClick={() => setOpenDialog(true)}
          disabled={!caja}
        >
          Registrar Gasto
        </Button>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell align="right">Monto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gastos.map((gasto) => (
                <TableRow key={gasto.id}>
                  <TableCell>{new Date(gasto.fecha).toLocaleString()}</TableCell>
                  <TableCell>{gasto.descripcion}</TableCell>
                  <TableCell>{gasto.usuario}</TableCell>
                  <TableCell align="right">Bs. {gasto.monto}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Registrar Gasto</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={gasto.descripcion}
                onChange={(e) => setGasto({ ...gasto, descripcion: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Monto"
                type="number"
                value={gasto.monto}
                onChange={(e) => setGasto({ ...gasto, monto: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
