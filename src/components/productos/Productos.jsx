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
  Autocomplete,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ref, push, get, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editando, setEditando] = useState(null);
  const [alerta, setAlerta] = useState({ show: false, message: '', severity: 'success' });
  const [producto, setProducto] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    stockMinimo: 0,
    categoria: null
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [productosSnapshot, categoriasSnapshot] = await Promise.all([
        get(ref(db, 'productos')),
        get(ref(db, 'categorias'))
      ]);

      const productosData = productosSnapshot.val() || {};
      setProductos(Object.entries(productosData).map(([id, data]) => ({
        id,
        ...data
      })));

      const categoriasData = categoriasSnapshot.val() || {};
      setCategorias(Object.entries(categoriasData).map(([id, data]) => ({
        id,
        ...data
      })));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta('Error al cargar los datos', 'error');
    }
  };

  const mostrarAlerta = (message, severity) => {
    setAlerta({ show: true, message, severity });
    setTimeout(() => setAlerta({ show: false, message: '', severity: 'success' }), 3000);
  };

  const handleSubmit = async () => {
    try {
      if (!producto.codigo || !producto.nombre || !producto.categoria) {
        mostrarAlerta('Por favor complete los campos requeridos', 'error');
        return;
      }

      if (editando) {
        await set(ref(db, `productos/${editando}`), {
          ...producto,
          categoria: producto.categoria.id,
          updatedAt: new Date().toISOString()
        });
        mostrarAlerta('Producto actualizado correctamente', 'success');
      } else {
        await push(ref(db, 'productos'), {
          ...producto,
          categoria: producto.categoria.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        mostrarAlerta('Producto creado correctamente', 'success');
      }

      setOpenDialog(false);
      setEditando(null);
      setProducto({
        codigo: '',
        nombre: '',
        descripcion: '',
        precio: 0,
        stock: 0,
        stockMinimo: 0,
        categoria: null
      });
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al guardar el producto', 'error');
    }
  };

  const handleEdit = (prod) => {
    setEditando(prod.id);
    setProducto({
      ...prod,
      categoria: categorias.find(c => c.id === prod.categoria)
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        await remove(ref(db, `productos/${id}`));
        mostrarAlerta('Producto eliminado correctamente', 'success');
        cargarDatos();
      } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar el producto', 'error');
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
        <Typography variant="h4">Productos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nuevo Producto
        </Button>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell>{prod.codigo}</TableCell>
                  <TableCell>{prod.nombre}</TableCell>
                  <TableCell>
                    {categorias.find(c => c.id === prod.categoria)?.nombre}
                  </TableCell>
                  <TableCell>{prod.precio}</TableCell>
                  <TableCell>{prod.stock}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(prod)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(prod.id)}>
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
        setProducto({
          codigo: '',
          nombre: '',
          descripcion: '',
          precio: 0,
          stock: 0,
          stockMinimo: 0,
          categoria: null
        });
      }}>
        <DialogTitle>{editando ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código de Barras"
                value={producto.codigoBarras}
                onChange={(e) => setProducto({ ...producto, codigoBarras: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código"
                value={producto.codigo}
                onChange={(e) => setProducto({ ...producto, codigo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={producto.nombre}
                onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={producto.descripcion}
                onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={categorias}
                getOptionLabel={(option) => option.nombre}
                value={producto.categoria}
                onChange={(_, newValue) => setProducto({ ...producto, categoria: newValue })}
                renderInput={(params) => (
                  <TextField {...params} label="Categoría" required />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Precio"
                type="number"
                value={producto.precio}
                onChange={(e) => setProducto({ ...producto, precio: parseFloat(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock"
                type="number"
                value={producto.stock}
                onChange={(e) => setProducto({ ...producto, stock: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Stock Mínimo"
                type="number"
                value={producto.stockMinimo}
                onChange={(e) => setProducto({ ...producto, stockMinimo: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditando(null);
            setProducto({
              codigo: '',
              nombre: '',
              descripcion: '',
              precio: 0,
              stock: 0,
              stockMinimo: 0,
              categoria: null
            });
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
