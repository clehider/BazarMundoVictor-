import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { ref, onValue, push } from 'firebase/database';
import {
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

export default function Caja() {
  const [movimientos, setMovimientos] = useState([]);
  const [balance, setBalance] = useState(0);
  const [open, setOpen] = useState(false);
  const [currentMovimiento, setCurrentMovimiento] = useState({
    tipo: 'ingreso',
    monto: '',
    descripcion: '',
    fecha: new Date().toISOString()
  });

  useEffect(() => {
    const movimientosRef = ref(db, 'movimientos_caja');
    const unsubscribe = onValue(movimientosRef, (snapshot) => {
      const data = snapshot.val();
      const movimientosArray = data ? Object.entries(data).map(([id, values]) => ({
        id,
        ...values
      })) : [];
      
      setMovimientos(movimientosArray.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      
      // Calcular balance
      const total = movimientosArray.reduce((acc, mov) => {
        return acc + (mov.tipo === 'ingreso' ? mov.monto : -mov.monto);
      }, 0);
      setBalance(total);
    });

    return () => unsubscribe();
  }, []);

  const handleOpen = (tipo) => {
    setCurrentMovimiento({
      tipo,
      monto: '',
      descripcion: '',
      fecha: new Date().toISOString()
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      if (currentMovimiento.monto && currentMovimiento.descripcion) {
        await push(ref(db, 'movimientos_caja'), {
          ...currentMovimiento,
          monto: Number(currentMovimiento.monto),
          fecha: new Date().toISOString()
        });
        handleClose();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Control de Caja
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance Actual
              </Typography>
              <Typography variant="h4" color={balance >= 0 ? 'success.main' : 'error.main'}>
                ${balance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => handleOpen('ingreso')}
          >
            Ingreso
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="error"
            startIcon={<RemoveIcon />}
            onClick={() => handleOpen('egreso')}
          >
            Egreso
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movimientos.map((movimiento) => (
              <TableRow key={movimiento.id}>
                <TableCell>{new Date(movimiento.fecha).toLocaleString()}</TableCell>
                <TableCell>
                  <Typography color={movimiento.tipo === 'ingreso' ? 'success.main' : 'error.main'}>
                    {movimiento.tipo.toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell>{movimiento.descripcion}</TableCell>
                <TableCell>
                  <Typography color={movimiento.tipo === 'ingreso' ? 'success.main' : 'error.main'}>
                    ${movimiento.monto.toFixed(2)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {currentMovimiento.tipo === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Monto"
            type="number"
            fullWidth
            value={currentMovimiento.monto}
            onChange={(e) => setCurrentMovimiento({
              ...currentMovimiento,
              monto: e.target.value
            })}
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            value={currentMovimiento.descripcion}
            onChange={(e) => setCurrentMovimiento({
              ...currentMovimiento,
              descripcion: e.target.value
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            color={currentMovimiento.tipo === 'ingreso' ? 'success' : 'error'}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
