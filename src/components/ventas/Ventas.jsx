import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Button, TextField, Table,
  TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Box, Alert, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import { ref, push, get, set, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase/config';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [openTicket, setOpenTicket] = useState(false);
  const [currentVenta, setCurrentVenta] = useState(null);
  const [alerta, setAlerta] = useState({ show: false, message: '', severity: 'success' });
  const [cajaActual, setCajaActual] = useState(null);

  useEffect(() => {
    // Suscripción en tiempo real a ventas
    const ventasRef = ref(db, 'ventas');
    const unsubscribe = onValue(ventasRef, (snapshot) => {
      const data = snapshot.val() || {};
      const ventasArray = Object.entries(data).map(([id, venta]) => ({
        id,
        ...venta
      })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setVentas(ventasArray);
    });

    // Cargar productos
    cargarProductos();
    // Cargar caja actual
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
          setCajaActual(cajas[0]);
        }
      } catch (error) {
        console.error('Error al cargar caja:', error);
      }
    };
    cargarCajaActual();

    return () => unsubscribe();
  }, []);

  const cargarProductos = async () => {
    const snapshot = await get(ref(db, 'productos'));
    const data = snapshot.val() || {};
    setProductos(Object.entries(data).map(([id, producto]) => ({
      id,
      ...producto
    })));
  };

  const handleBarcodeKeyPress = async (e) => {
    if (e.key === 'Enter') {
      const codigo = e.target.value;
      const producto = productos.find(p => p.codigo === codigo);
      
      if (producto) {
        // Verificar si el producto ya está en el carrito
        const itemExistente = carrito.find(item => item.id === producto.id);
        
        if (itemExistente) {
          // Si el producto ya está en el carrito y hay stock suficiente
          if (itemExistente.cantidad + 1 <= producto.stock) {
            setCarrito(carrito.map(item =>
              item.id === producto.id
                ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio }
                : item
            ));
            setAlerta({
              show: true,
              message: 'Cantidad actualizada en el carrito',
              severity: 'success'
            });
          } else {
            setAlerta({
              show: true,
              message: 'Stock insuficiente',
              severity: 'warning'
            });
          }
        } else {
          // Si el producto no está en el carrito y hay stock
          if (producto.stock > 0) {
            const nuevoItem = {
              id: producto.id,
              codigo: producto.codigo,
              nombre: producto.nombre,
              precio: producto.precio,
              cantidad: 1,
              stock: producto.stock,
              subtotal: producto.precio
            };
            setCarrito([...carrito, nuevoItem]);
            setAlerta({
              show: true,
              message: 'Producto agregado al carrito',
              severity: 'success'
            });
          } else {
            setAlerta({
              show: true,
              message: 'Producto sin stock',
              severity: 'error'
            });
          }
        }
      } else {
        setAlerta({
          show: true,
          message: 'Producto no encontrado',
          severity: 'error'
        });
      }
      
      // Limpiar input y mantener el foco
      e.target.value = '';
      e.target.focus();
    }
  };

  const actualizarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > 0 && nuevaCantidad <= item.stock) {
          return { 
            ...item, 
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precio
          };
        }
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

const completarVenta = async () => {
    if (carrito.length === 0) return;

    if (!cajaActual) {
      setAlerta({
        show: true,
        message: 'No hay una caja abierta. Por favor, abra la caja primero.',
        severity: 'error'
      });
      return;
    }

    try {
      const fecha = new Date().toISOString();
      const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      
      const ventaData = {
        items: carrito,
        total: total,
        fecha: fecha
      };

      // Guardar venta
      const ventaRef = await push(ref(db, 'ventas'), ventaData);
      // Actualizar caja
      await set(ref(db, `cajas/${cajaActual.id}/totalVentas`), cajaActual.totalVentas + total);

      // Registrar movimiento en caja
      await push(ref(db, `movimientos/${cajaActual.id}`), {
        tipo: 'venta',
        monto: total,
        fecha: fecha,
        descripcion: `Venta #${ventaRef.key}`,
        usuario: 'sistema'
      });

      // Actualizar stock de productos
      for (const item of carrito) {
        const productoRef = ref(db, `productos/${item.id}`);
        const snapshot = await get(productoRef);
        const producto = snapshot.val();
        await set(productoRef, {
          ...producto,
          stock: producto.stock - item.cantidad
        });
      }

      // Mostrar ticket
      setCurrentVenta({ id: ventaRef.key, ...ventaData });
      setOpenTicket(true);

      // Limpiar carrito
      setCarrito([]);

      setAlerta({
        show: true,
        message: 'Venta completada exitosamente',
        severity: 'success'
      });

      // Imprimir ticket automáticamente
      imprimirTicket(ventaData);
    } catch (error) {
      console.error('Error:', error);
      setAlerta({
        show: true,
        message: 'Error al procesar la venta',
        severity: 'error'
      });
    }
  };

  const imprimirTicket = (venta) => {
    const ticketWindow = window.open('', '_blank');
    ticketWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Venta</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .items { margin-bottom: 20px; }
            .item { margin-bottom: 5px; }
            .total { border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Mundo Victor</h2>
            <p>Ticket de Venta</p>
            <p>${new Date(venta.fecha).toLocaleString()}</p>
          </div>
          <div class="items">
            ${venta.items.map(item => `
              <div class="item">
                <p>${item.nombre}</p>
                <p>Cant: ${item.cantidad} x Bs. ${item.precio} = Bs. ${item.cantidad * item.precio}</p>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <h3>Total: Bs. ${venta.total.toFixed(2)}</h3>
          </div>
        </body>
      </html>
    `);
    ticketWindow.document.close();
    ticketWindow.print();
  };

  return (
    <Grid container spacing={3}>
      {alerta.show && (
        <Grid item xs={12}>
          <Alert 
            severity={alerta.severity}
            onClose={() => setAlerta({ ...alerta, show: false })}
          >
            {alerta.message}
          </Alert>
        </Grid>
      )}

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Carrito de Compras
            </Typography>
            <TextField
              fullWidth
              placeholder="Escanear código de barras"
              autoFocus
              onKeyPress={handleBarcodeKeyPress}
              sx={{ mb: 2 }}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Precio (Bs)</TableCell>
                    <TableCell align="center">Cantidad</TableCell>
                    <TableCell align="right">Subtotal (Bs)</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carrito.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell align="right">{item.precio}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <IconButton
                            size="small"
                            onClick={() => actualizarCantidad(item.id, -1)}
                            disabled={item.cantidad <= 1}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography sx={{ mx: 1 }}>{item.cantidad}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => actualizarCantidad(item.id, 1)}
                            disabled={item.cantidad >= item.stock}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {(item.precio * item.cantidad).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          onClick={() => eliminarDelCarrito(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <Typography variant="h6">
                Total: Bs. {carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toFixed(2)}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCarrito([])}
                  sx={{ mr: 1 }}
                  disabled={carrito.length === 0}
                >
                  Limpiar Carrito
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={completarVenta}
                  disabled={carrito.length === 0}
                >
                  Completar Venta
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Últimas Ventas
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Total (Bs)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventas.slice(0, 5).map((venta) => (
                    <TableRow key={venta.id}>
                      <TableCell>
                        {new Date(venta.fecha).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {venta.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={openTicket} onClose={() => setOpenTicket(false)}>
        <DialogTitle>Ticket de Venta</DialogTitle>
        <DialogContent>
          {currentVenta && (
            <Box>
              <Typography variant="h6">Mundo Victor</Typography>
              <Typography>Fecha: {new Date(currentVenta.fecha).toLocaleString()}</Typography>
              {currentVenta.items.map((item, index) => (
                <Box key={index} my={1}>
                  <Typography>{item.nombre}</Typography>
                  <Typography>
                    {item.cantidad} x Bs. {item.precio} = Bs. {item.cantidad * item.precio}
                  </Typography>
                </Box>
              ))}
              <Typography variant="h6" mt={2}>
                Total: Bs. {currentVenta.total.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTicket(false)}>Cerrar</Button>
          <Button 
            onClick={() => currentVenta && imprimirTicket(currentVenta)}
            startIcon={<PrintIcon />}
          >
            Reimprimir
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
