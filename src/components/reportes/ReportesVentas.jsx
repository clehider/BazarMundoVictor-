import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { ref, onValue } from 'firebase/database';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Box
} from '@mui/material';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { formatCurrency } from '../../utils/format';
import * as XLSX from 'xlsx';

export default function ReportesVentas() {
  const [ventas, setVentas] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    promedioVenta: 0,
    productosMasVendidos: [],
    ventasPorDia: []
  });

  useEffect(() => {
    const ventasRef = ref(db, 'ventas');
    const unsubscribe = onValue(ventasRef, (snapshot) => {
      const data = snapshot.val();
      const ventasArray = data ? Object.entries(data).map(([id, values]) => ({
        id,
        ...values
      })) : [];
      setVentas(ventasArray);
      calcularEstadisticas(ventasArray);
    });

    return () => unsubscribe();
  }, []);

  const calcularEstadisticas = (ventasData) => {
    const ventasFiltradas = ventasData.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= new Date(fechaInicio) && fechaVenta <= new Date(fechaFin);
    });

    // Calcular total y promedio
    const total = ventasFiltradas.reduce((acc, venta) => acc + venta.total, 0);
    const promedio = ventasFiltradas.length > 0 ? total / ventasFiltradas.length : 0;

    // Productos más vendidos
    const productosContador = {};
    ventasFiltradas.forEach(venta => {
      venta.productos.forEach(prod => {
        productosContador[prod.nombre] = (productosContador[prod.nombre] || 0) + prod.cantidad;
      });
    });

    const productosMasVendidos = Object.entries(productosContador)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // Ventas por día
    const ventasPorDia = {};
    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha).toISOString().split('T')[0];
      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + venta.total;
    });

    setEstadisticas({
      totalVentas: total,
      promedioVenta: promedio,
      productosMasVendidos,
      ventasPorDia: Object.entries(ventasPorDia).map(([fecha, total]) => ({
        fecha,
        total
      }))
    });
  };

  const exportarExcel = () => {
    const ventasFiltradas = ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= new Date(fechaInicio) && fechaVenta <= new Date(fechaFin);
    });

    const wb = XLSX.utils.book_new();
    
    // Hoja de ventas
    const ventasWS = XLSX.utils.json_to_sheet(ventasFiltradas.map(venta => ({
      Fecha: new Date(venta.fecha).toLocaleString(),
      Total: venta.total,
      'Cantidad de Productos': venta.productos.length
    })));
    XLSX.utils.book_append_sheet(wb, ventasWS, "Ventas");

    // Hoja de productos vendidos
    const productosVendidos = [];
    ventasFiltradas.forEach(venta => {
      venta.productos.forEach(prod => {
        productosVendidos.push({
          Fecha: new Date(venta.fecha).toLocaleString(),
          Producto: prod.nombre,
          Cantidad: prod.cantidad,
          'Precio Unitario': prod.precio,
          Subtotal: prod.subtotal
        });
      });
    });
    const productosWS = XLSX.utils.json_to_sheet(productosVendidos);
    XLSX.utils.book_append_sheet(wb, productosWS, "Productos Vendidos");

    // Generar y descargar el archivo
    XLSX.writeFile(wb, `reporte_ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Reportes de Ventas
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            type="date"
            label="Fecha Inicio"
            value={fechaInicio}
            onChange={(e) => {
              setFechaInicio(e.target.value);
              calcularEstadisticas(ventas);
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            type="date"
            label="Fecha Fin"
            value={fechaFin}
            onChange={(e) => {
              setFechaFin(e.target.value);
              calcularEstadisticas(ventas);
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Button 
        variant="contained" 
        onClick={exportarExcel}
        sx={{ mb: 4 }}
      >
        Exportar a Excel
      </Button>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Ventas
              </Typography>
              <Typography variant="h4">
                {formatCurrency(estadisticas.totalVentas)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Promedio por Venta
              </Typography>
              <Typography variant="h4">
                {formatCurrency(estadisticas.promedioVenta)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ventas por Día
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveBar
              data={estadisticas.ventasPorDia}
              keys={['total']}
              indexBy="fecha"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              colors={{ scheme: 'nivo' }}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 45,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Ventas',
                legendPosition: 'middle',
                legendOffset: -40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
            />
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Productos Más Vendidos
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsivePie
              data={estadisticas.productosMasVendidos.map(prod => ({
                id: prod.nombre,
                label: prod.nombre,
                value: prod.cantidad
              }))}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
            />
          </Box>
        </Paper>
      </Box>
    </>
  );
}
