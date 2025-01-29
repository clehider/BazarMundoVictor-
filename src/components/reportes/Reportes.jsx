import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Button, Card, CardContent,
  TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tab, Tabs, Box, Alert,
  CircularProgress
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import DownloadIcon from '@mui/icons-material/Download';
import { ref, get, query, orderByChild } from 'firebase/database';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Reportes() {
  const [tabValue, setTabValue] = useState(0);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState({ show: false, message: '', severity: 'success' });
  const [ventasData, setVentasData] = useState({
    diarias: [],
    productosVendidos: [],
    inventario: []
  });

  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [ventasSnap, productosSnap] = await Promise.all([
        get(query(ref(db, 'ventas'), orderByChild('fecha'))),
        get(ref(db, 'productos'))
      ]);

      const ventasData = ventasSnap.val() || {};
      const productosData = productosSnap.val() || {};

      const ventasFiltradas = Object.entries(ventasData)
        .map(([id, venta]) => ({ id, ...venta }))
        .filter(venta => 
          venta.fecha >= fechaInicio && 
          venta.fecha <= fechaFin + 'T23:59:59'
        );

      setVentas(ventasFiltradas);
      setProductos(Object.entries(productosData).map(([id, prod]) => ({ id, ...prod })));

      procesarDatos(ventasFiltradas, productosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta('Error al cargar los datos', 'error');
    }
    setLoading(false);
  };

  const procesarDatos = (ventas, productos) => {
    // Ventas diarias
    const ventasPorDia = ventas.reduce((acc, venta) => {
      const fecha = venta.fecha.split('T')[0];
      acc[fecha] = (acc[fecha] || 0) + venta.total;
      return acc;
    }, {});

    // Productos más vendidos
    const ventasPorProducto = ventas.reduce((acc, venta) => {
      if (venta.items) {
        venta.items.forEach(item => {
          acc[item.nombre] = (acc[item.nombre] || 0) + item.cantidad;
        });
      }
      return acc;
    }, {});

    // Inventario actual
    const inventarioActual = Object.values(productos).map(prod => ({
      nombre: prod.nombre,
      stock: prod.stock,
      stockMinimo: prod.stockMinimo
    }));

    setVentasData({
      diarias: {
        labels: Object.keys(ventasPorDia),
        datasets: [{
          label: 'Ventas Diarias (Bs)',
          data: Object.values(ventasPorDia),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
        }]
      },
      productosVendidos: {
        labels: Object.keys(ventasPorProducto),
        datasets: [{
          label: 'Cantidad Vendida',
          data: Object.values(ventasPorProducto),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
        }]
      },
      inventario: inventarioActual
    });
  };

  const mostrarAlerta = (message, severity) => {
    setAlerta({ show: true, message, severity });
    setTimeout(() => setAlerta({ show: false, message: '', severity: 'success' }), 3000);
  };

  const exportarExcel = (datos, nombreArchivo) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
  };

  const exportarVentas = () => {
    const datosExport = ventas.map(venta => ({
      Fecha: new Date(venta.fecha).toLocaleString(),
      Total: venta.total,
      Productos: venta.items ? venta.items.map(item => 
        `${item.nombre} (${item.cantidad})`
      ).join(', ') : ''
    }));
    exportarExcel(datosExport, `Ventas_${fechaInicio}_${fechaFin}`);
  };

  const exportarInventario = () => {
    const datosExport = productos.map(prod => ({
      Código: prod.codigo,
      Nombre: prod.nombre,
      Stock: prod.stock,
      'Stock Mínimo': prod.stockMinimo,
      Precio: prod.precio
    }));
    exportarExcel(datosExport, `Inventario_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <Grid container spacing={3}>
      {alerta.show && (
        <Grid item xs={12}>
          <Alert severity={alerta.severity}>{alerta.message}</Alert>
        </Grid>
      )}

      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Reportes
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fecha Inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fecha Fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={exportarVentas}
                  >
                    Exportar Ventas
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={exportarInventario}
                  >
                    Exportar Inventario
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          centered
        >
          <Tab label="Ventas Diarias" />
          <Tab label="Productos más Vendidos" />
          <Tab label="Estado de Inventario" />
        </Tabs>
      </Grid>

      {loading ? (
        <Grid item xs={12} textAlign="center">
          <CircularProgress />
        </Grid>
      ) : (
        <>
          <Grid item xs={12} style={{ display: tabValue === 0 ? 'block' : 'none' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ventas Diarias
                </Typography>
                {ventasData.diarias.labels && (
                  <Line
                    data={ventasData.diarias}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} style={{ display: tabValue === 1 ? 'block' : 'none' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Productos más Vendidos
                </Typography>
                {ventasData.productosVendidos.labels && (
                  <Bar
                    data={ventasData.productosVendidos}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} style={{ display: tabValue === 2 ? 'block' : 'none' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estado de Inventario
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="right">Stock Actual</TableCell>
                        <TableCell align="right">Stock Mínimo</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ventasData.inventario.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell align="right">{item.stock}</TableCell>
                          <TableCell align="right">{item.stockMinimo}</TableCell>
                          <TableCell>
                            {item.stock <= item.stockMinimo ? (
                              <Typography color="error">Stock Bajo</Typography>
                            ) : (
                              <Typography color="success">Normal</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );
}
