import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAWKf3x3DIoWlXzbUI6hXB7VS3cc6bFPxA",
  authDomain: "mundovictorbazarscz.firebaseapp.com",
  projectId: "mundovictorbazarscz",
  databaseURL: "https://mundovictorbazarscz-default-rtdb.firebaseio.com",
  storageBucket: "mundovictorbazarscz.applestorage.app",
  messagingSenderId: "446777268388",
  appId: "1:446777268388:web:7c71aa9384d8d9a3a8ee31"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;
