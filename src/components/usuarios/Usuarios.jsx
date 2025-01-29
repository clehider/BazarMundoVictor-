import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton,
  Alert, MenuItem, Select, FormControl,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ref, push, get, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editando, setEditando] = useState(null);
  const [alerta, setAlerta] = useState({ show: false, message: '', severity: 'success' });
  const [usuario, setUsuario] = useState({
    nombre: '',
    email: '',
    rol: 'vendedor',
    password: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const snapshot = await get(ref(db, 'usuarios'));
      const data = snapshot.val() || {};
      setUsuarios(Object.entries(data).map(([id, data]) => ({
        id,
        ...data
      })));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      mostrarAlerta('Error al cargar los usuarios', 'error');
    }
  };

  const mostrarAlerta = (message, severity) => {
    setAlerta({ show: true, message, severity });
    setTimeout(() => setAlerta({ show: false, message: '', severity: 'success' }), 3000);
  };

  const handleSubmit = async () => {
    try {
      if (!usuario.nombre || !usuario.email || !usuario.rol) {
        mostrarAlerta('Por favor complete todos los campos requeridos', 'error');
        return;
      }

      if (!editando && !usuario.password) {
        mostrarAlerta('La contraseña es requerida para nuevos usuarios', 'error');
        return;
      }

      if (editando) {
        await set(ref(db, `usuarios/${editando}`), {
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          updatedAt: new Date().toISOString()
        });
        mostrarAlerta('Usuario actualizado correctamente', 'success');
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          usuario.email,
          usuario.password
        );
        
        await set(ref(db, `usuarios/${userCredential.user.uid}`), {
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        mostrarAlerta('Usuario creado correctamente', 'success');
      }

      setOpenDialog(false);
      setEditando(null);
      setUsuario({
        nombre: '',
        email: '',
        rol: 'vendedor',
        password: ''
      });
      cargarUsuarios();
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta(error.message, 'error');
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
        <Typography variant="h4">Usuarios</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nuevo Usuario
        </Button>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.nombre}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.rol}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => {
                      setEditando(user.id);
                      setUsuario({
                        nombre: user.nombre,
                        email: user.email,
                        rol: user.rol,
                        password: ''
                      });
                      setOpenDialog(true);
                    }}>
                      <EditIcon />
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
        setUsuario({
          nombre: '',
          email: '',
          rol: 'vendedor',
          password: ''
        });
      }}>
        <DialogTitle>
          {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={usuario.nombre}
                onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={usuario.email}
                onChange={(e) => setUsuario({ ...usuario, email: e.target.value })}
                required
                disabled={editando}
              />
            </Grid>
            {!editando && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={usuario.password}
                  onChange={(e) => setUsuario({ ...usuario, password: e.target.value })}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={usuario.rol}
                  label="Rol"
                  onChange={(e) => setUsuario({ ...usuario, rol: e.target.value })}
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="vendedor">Vendedor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditando(null);
            setUsuario({
              nombre: '',
              email: '',
              rol: 'vendedor',
              password: ''
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
