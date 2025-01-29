import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Card, CardContent, CardHeader } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';

export default function Dashboard() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    totalProductos: 0,
    stockBajo: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString().split('T')[0];

        // Obtener ventas
        const ventasRef = ref(db, 'ventas');
        const ventasSnapshot = await get(ventasRef);
        const ventas = ventasSnapshot.val() || {};

        // Obtener productos
        const productosRef = ref(db, 'productos');
        const productosSnapshot = await get(productosRef);
        const productos = productosSnapshot.val() || {};

        // Calcular estadísticas
        const ventasArray = Object.values(ventas);
        const ventasHoy = ventasArray.filter(v => v.fecha.startsWith(today)).length;
        const ventasMes = ventasArray.filter(v => v.fecha >= firstDayOfMonth).length;
        const productosArray = Object.values(productos);
        const stockBajo = productosArray.filter(p => p.stock <= p.stockMinimo).length;

        setStats({
          ventasHoy,
          ventasMes,
          totalProductos: productosArray.length,
          stockBajo
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: 'Ventas de Hoy',
      value: stats.ventasHoy,
      icon: <ShoppingCartIcon sx={{ fontSize: 40, color: 'primary.main' }} />
    },
    {
      title: 'Ventas del Mes',
      value: stats.ventasMes,
      icon: <AttachMoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
    },
    {
      title: 'Total Productos',
      value: stats.totalProductos,
      icon: <InventoryIcon sx={{ fontSize: 40, color: 'info.main' }} />
    },
    {
      title: 'Stock Bajo',
      value: stats.stockBajo,
      icon: <InventoryIcon sx={{ fontSize: 40, color: 'warning.main' }} />
    }
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
      </Grid>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardHeader
              avatar={card.icon}
              title={card.title}
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Typography variant="h4" align="center">
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
