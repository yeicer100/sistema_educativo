require('dotenv').config();
const express = require('express');
const path = require('path');
const { auth, rol } = require('./src/auth');
const { h } = require('./src/util');
const { ficha } = require('./src/servicios');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./src/routes/auth.routes'));

app.use('/api/dashboard',   auth, rol('admin'), require('./src/routes/dashboard.routes'));
app.use('/api/estudiantes', auth, rol('admin'), require('./src/routes/estudiantes.routes'));
app.use('/api/docentes',    auth, rol('admin'), require('./src/routes/docentes.routes'));
app.use('/api/usuarios',    auth, rol('admin'), require('./src/routes/usuarios.routes'));
app.use('/api/matriculas',  auth, rol('admin'), require('./src/routes/matriculas.routes'));


app.use('/api/docencia', auth, rol('admin', 'docente'), require('./src/routes/docencia.routes'));

app.get('/api/yo/ficha', auth, rol('estudiante'),
  h(async (req, res) => res.json(await ficha(req.user.id_estudiante))));

app.use('/api', auth, rol('admin'), require('./src/routes/academico.routes'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((e, req, res, next) => {
  if (e.status) return res.status(e.status).json({ error: e.message });
  if (e.sqlState === '45000') return res.status(400).json({ error: e.sqlMessage });
  if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un registro con esos datos (documento, correo o combinación repetida)' });
  if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Alguno de los datos relacionados no es válido' });
  console.error(e);
  res.status(500).json({ error: 'Error del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`EduGest en http://localhost:${PORT}`));
