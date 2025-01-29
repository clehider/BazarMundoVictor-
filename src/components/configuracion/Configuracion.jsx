import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, TextField,
  Button, Alert, Card, CardContent
} from '@mui/material';
import { ref, get, set } from 'firebase/database';
import { db } from '../../firebase/config';

export default function Configuracion() {
  const [config, setConfig] = useState({
    empresa: {
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      moneda: 'Bs.',
      nit: '',
      mensaje_ticket: ''
    }
  });
  const [alerta, setAlerta] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const snapshot = await get(ref(db, 'configuracion'));
      if (snapshot.exists()) {
        setConfig(snapshot.val());
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      mostrarAlerta('Error al cargar la configuración', 'error');
    }
  };

  const mostrarAlerta = (message, severity) => {
    setAlerta({ show: true, message, severity });
    setTimeout(() => setAlerta({ show: false, message: '', severity: 'success' }), 3000);
  };

  const handleSubmit = async () => {
    try {
      await set(ref(db, 'configuracion'), {
        ...config,
        updatedAt: new Date().toISOString()
      });
      mostrarAlerta('Configuración actualizada correctamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al guardar la configuración', 'error');
    }
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
          Configuración del Sistema
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información de la Empresa
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre de la Empresa"
                  value={config.empresa.nombre}
                  onChange={(e) => setConfig({
                    ...config,
                    empresa: { ...config.empresa, nombre: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={config.empresa.direccion}
                  onChange={(e) => setConfig({
                    ...config,
                    empresa: { ...config.empresa, direccion: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={config.empresa.telefono}
                  onChange={(e) => setConfig({
                    ...config,
                    empresa: { ...config.empresa, telefono: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="NIT"
                  value={config.empresa.nit}
                  onChange={(e) => setConfig({
                    ...config,
                    empresa: { ...config.empresa, nit: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={config.empresa.email}
                  onChange={(e) => setConfig({
                    ...config,
                    empresa: { ...config.empresa, email: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mensaje en Ticket"
                  multiline
                  rows={3}
                  value={config.empresa.mensaje_ticket}
                  onChange={(e) => setConfig({
                    ...config,
                    empresa: { ...config.empresa, mensaje_ticket: e.target.value }
                  })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
        >
          Guardar Configuración
        </Button>
      </Grid>
    </Grid>
  );
}
