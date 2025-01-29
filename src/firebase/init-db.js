import { ref, set, get } from 'firebase/database';
import { db } from './config';

const initialData = {
  usuarios: {
    't8o5FvHMTYSMLTUddFh6is6lAJj1': {
      email: 'admin@mundovictor.com',
      rol: 'admin',
      nombre: 'Administrador',
      createdAt: '2025-01-29 13:07:44',
      lastLogin: '2025-01-29 13:07:44'
    }
  },
  roles: {
    admin: {
      nombre: 'Administrador',
      permisos: ['todos']
    },
    vendedor: {
      nombre: 'Vendedor',
      permisos: ['ventas', 'productos']
    }
  },
  categorias: {
    cat1: {
      nombre: 'General',
      createdAt: '2025-01-29 13:07:44',
      updatedAt: '2025-01-29 13:07:44'
    }
  },
  productos: {},
  ventas: {},
  configuracion: {
    empresa: {
      nombre: 'Mundo Victor',
      direccion: 'Santa Cruz, Bolivia',
      telefono: '',
      email: 'admin@mundovictor.com',
      moneda: 'BOB',
      updatedAt: '2025-01-29 13:07:44'
    }
  }
};

export const initializeDatabase = async () => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(dbRef);
    
    if (!snapshot.exists()) {
      await set(dbRef, initialData);
      console.log('Base de datos inicializada correctamente');
    } else {
      console.log('La base de datos ya está inicializada');
      // Actualizar lastLogin del usuario
      const userRef = ref(db, `usuarios/t8o5FvHMTYSMLTUddFh6is6lAJj1/lastLogin`);
      await set(userRef, '2025-01-29 13:07:44');
    }
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
  }
};
