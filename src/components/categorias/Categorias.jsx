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
  IconButton,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ref, push, get, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editando, setEditando] = useState(null);
  const [alerta, setAlerta] = useState({ show: false, message: '', severity: 'success' });
  const [categoria, setCategoria] = useState({
    nombre: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const snapshot = await get(ref(db, 'categorias'));
      const data = snapshot.val() || {};
      setCategorias(Object.entries(data).map(([id, data]) => ({
        id,
        ...data
      })));
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      mostrarAlerta('Error al cargar las categorías', 'error');
    }
  };

  const mostrarAlerta = (message, severity) => {
    setAlerta({ show: true, message, severity });
    setTimeout(() => setAlerta({ show: false, message: '', severity: 'success' }), 3000);
  };

  const handleSubmit = async () => {
    try {
      if (!categoria.nombre) {
        mostrarAlerta('Por favor ingrese el nombre de la categoría', 'error');
        return;
      }

      if (editando) {
        await set(ref(db, `categorias/${editando}`), {
          ...categoria,
          updatedAt: new Date().toISOString()
        });
        mostrarAlerta('Categoría actualizada correctamente', 'success');
      } else {
        await push(ref(db, 'categorias'), {
          ...categoria,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        mostrarAlerta('Categoría creada correctamente', 'success');
      }

      setOpenDialog(false);
      setEditando(null);
      setCategoria({ nombre: '', descripcion: '' });
      cargarCategorias();
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al guardar la categoría', 'error');
    }
  };

  const handleEdit = (cat) => {
    setEditando(cat.id);
    setCategoria({ nombre: cat.nombre, descripcion: cat.descripcion });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta categoría?')) {
      try {
        await remove(ref(db, `categorias/${id}`));
        mostrarAlerta('Categoría eliminada correctamente', 'success');
        cargarCategorias();
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar la categoría', 'error');
      }
    }
  };

  return (
    <Grid container spacing={3}>
      {alerta.show && (
        <Grid item xs={12}>
          <Alert severity={alerta.severity}>{alerta.message}</Alert>
        </Grid>
      )}

      <Grid item xs={12} display="flex" justifyContent="space-between">
        <Typography variant="h4">Categorías</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nueva Categoría
        </Button>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Fecha de Creación</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categorias.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.nombre}</TableCell>
                  <TableCell>{cat.descripcion}</TableCell>
                  <TableCell>
                    {new Date(cat.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(cat)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(cat.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setEditando(null);
        setCategoria({ nombre: '', descripcion: '' });
      }}>
        <DialogTitle>
          {editando ? 'Editar Categoría' : 'Nueva Categoría'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={categoria.nombre}
                onChange={(e) => setCategoria({ ...categoria, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={categoria.descripcion}
                onChange={(e) => setCategoria({ ...categoria, descripcion: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditando(null);
            setCategoria({ nombre: '', descripcion: '' });
          }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editando ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
