import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function BusquedaAvanzada({ onSearch, categorias = [] }) {
  const [filtros, setFiltros] = useState({
    texto: '',
    categoria: '',
    precioMin: '',
    precioMax: '',
    fechaDesde: '',
    fechaHasta: '',
    stock: 'todos'
  });

  const handleChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(filtros);
    }
  };

  const handleClear = () => {
    setFiltros({
      texto: '',
      categoria: '',
      precioMin: '',
      precioMax: '',
      fechaDesde: '',
      fechaHasta: '',
      stock: 'todos'
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Búsqueda Avanzada
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Buscar producto"
            value={filtros.texto}
            onChange={(e) => handleChange('texto', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={filtros.categoria}
              label="Categoría"
              onChange={(e) => handleChange('categoria', e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {categorias.map((categoria) => (
                <MenuItem key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Stock</InputLabel>
            <Select
              value={filtros.stock}
              label="Stock"
              onChange={(e) => handleChange('stock', e.target.value)}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="conStock">Con Stock</MenuItem>
              <MenuItem value="sinStock">Sin Stock</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Precio mínimo"
            value={filtros.precioMin}
            onChange={(e) => handleChange('precioMin', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Precio máximo"
            value={filtros.precioMax}
            onChange={(e) => handleChange('precioMax', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="date"
            label="Fecha desde"
            InputLabelProps={{ shrink: true }}
            value={filtros.fechaDesde}
            onChange={(e) => handleChange('fechaDesde', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="date"
            label="Fecha hasta"
            InputLabelProps={{ shrink: true }}
            value={filtros.fechaHasta}
            onChange={(e) => handleChange('fechaHasta', e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Buscar
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
            >
              Limpiar
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
