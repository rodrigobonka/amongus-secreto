const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpetas necesarias
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'data.json');
const SEED_FILE = path.join(__dirname, 'seed.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Extensiones permitidas (imagen, video, música, documentos)
const EXTENSIONES_PERMITIDAS = /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif|pdf|doc|docx|txt|odt|mp3|wav|m4a|ogg|aac|flac|mp4|webm|mov|avi|mkv)$/i;

// Inicializar o cargar datos
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (data.buzzones && data.buzzones.length > 0) return data;
  } catch (_) {}

  // Seed inicial con los 12 participantes
  let participantes = [
    'Ambar Julissa Gómez',
    'Cindy Elizabeth Diaz Guzman',
    'Dayan Guerra',
    'Georgie De Aries',
    'Gilberto Acevedo',
    'Hector Reina',
    'Mani Delgado Rubí',
    'Manolete Vicente',
    'Rogelio Valadez',
    'Rodrigo Bonka',
    'Sandra Isabel Ramos Ramírez',
    'Víctor Josué Palomares Pérez'
  ];

  try {
    const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    if (seed.participantes && seed.participantes.length > 0) participantes = seed.participantes;
  } catch (_) {}

  const data = {
    adminKey: 'amongus14',  // Clave fija para los buzones preconfigurados
    buzzones: participantes.map((nombre) => ({
      id: uuidv4(),
      nombre,
      codigoSubida: uuidv4().replace(/-/g, '').slice(0, 12),
      codigoVision: uuidv4().replace(/-/g, '').slice(0, 12),
      items: []
    }))
  };
  saveData(data);
  return data;
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando data.json:', err);
    throw err;
  }
}

// Multer: subida de archivos robusta
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50);
    cb(null, `${uuidv4()}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimePermitidos = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      'image/heic', 'image/heif',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/vnd.oasis.opendocument.text',
      'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/flac',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'
    ];
    if (EXTENSIONES_PERMITIDAS.test(file.originalname) || mimePermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo no permitido: ${file.originalname}. Usa imágenes, PDF, audio o video.`));
    }
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ============ ADMIN ============

app.post('/api/admin/buzzones', (req, res) => {
  const { adminKey, participantes } = req.body;
  const data = loadData();
  const esPrimeraVez = !data.buzzones || data.buzzones.length === 0;

  // Los códigos son definitivos: una vez creados, no se pueden cambiar
  if (!esPrimeraVez) {
    return res.status(403).json({ error: 'Los buzones ya existen. Los códigos de subida y visión son definitivos y no pueden cambiarse.' });
  }
  if (adminKey !== data.adminKey) return res.status(403).json({ error: 'Clave admin incorrecta' });

  const nombres = Array.isArray(participantes)
    ? participantes.map((p) => String(p).trim()).filter(Boolean)
    : String(participantes || '').split('\n').map((p) => p.trim()).filter(Boolean);

  const buzzones = nombres.map((nombre) => ({
    id: uuidv4(),
    nombre,
    codigoSubida: uuidv4().replace(/-/g, '').slice(0, 12),
    codigoVision: uuidv4().replace(/-/g, '').slice(0, 12),
    items: []
  }));

  data.buzzones = buzzones;
  saveData(data);
  res.json({ buzzones, adminKey: data.adminKey });
});

app.get('/api/admin/info', (req, res) => {
  const { key } = req.query;
  const data = loadData();
  if (key !== data.adminKey) return res.status(403).json({ error: 'Clave admin incorrecta' });
  res.json({
    buzzones: data.buzzones.map((b) => ({
      nombre: b.nombre,
      codigoSubida: b.codigoSubida,
      codigoVision: b.codigoVision
    }))
  });
});

// ============ INFO POR CÓDIGO (para mostrar nombre) ============

app.get('/api/codigo-subida-info', (req, res) => {
  const { codigo } = req.query;
  const data = loadData();
  const buzton = data.buzzones.find((b) => b.codigoSubida === codigo);
  if (!buzton) return res.status(404).json({ error: 'Código no válido' });
  res.json({ nombre: buzton.nombre });
});

app.get('/api/buzon-nombre', (req, res) => {
  const { codigoVision } = req.query;
  const data = loadData();
  const buzton = data.buzzones.find((b) => b.codigoVision === codigoVision);
  if (!buzton) return res.status(404).json({ error: 'Código no válido' });
  res.json({ nombre: buzton.nombre });
});

// ============ SUBIR (anónimo) ============

app.post('/api/subir', (req, res, next) => {
  upload.single('archivo')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message || 'Error al subir el archivo' });
    }
    next();
  });
}, (req, res) => {
  try {
    const { codigoSubida, tipo, contenido, link } = req.body || {};
    const data = loadData();
    const buzton = data.buzzones.find((b) => b.codigoSubida === codigoSubida);
    if (!buzton) return res.status(404).json({ error: 'Código de subida no válido' });

    const item = {
      id: uuidv4(),
      tipo: tipo || (req.file ? 'archivo' : 'texto'),
      contenido: String(contenido || '').trim(),
      link: String(link || '').trim(),
      archivo: req.file ? `/uploads/${req.file.filename}` : null,
      fecha: new Date().toISOString()
    };

    buzton.items.push(item);
    saveData(data);
    res.json({ ok: true, mensaje: '¡Tu cosita llegó al buzón! 💌' });
  } catch (err) {
    console.error('Error subir:', err);
    res.status(500).json({ error: err.message || 'Error al guardar' });
  }
});

app.post('/api/subir-link', (req, res) => {
  try {
    const { codigoSubida, tipo, contenido, link } = req.body || {};
    const data = loadData();
    const buzton = data.buzzones.find((b) => b.codigoSubida === codigoSubida);
    if (!buzton) return res.status(404).json({ error: 'Código de subida no válido' });

    const item = {
      id: uuidv4(),
      tipo: tipo || 'link',
      contenido: String(contenido || '').trim(),
      link: String(link || '').trim(),
      archivo: null,
      fecha: new Date().toISOString()
    };

    buzton.items.push(item);
    saveData(data);
    res.json({ ok: true, mensaje: '¡Tu cosita llegó al buzón! 💌' });
  } catch (err) {
    console.error('Error subir-link:', err);
    res.status(500).json({ error: err.message || 'Error al guardar' });
  }
});

// ============ VER BUZÓN ============

app.get('/api/buzon', (req, res) => {
  const { codigoVision } = req.query;
  const data = loadData();
  const buzton = data.buzzones.find((b) => b.codigoVision === codigoVision);
  if (!buzton) return res.status(404).json({ error: 'Código de visualización no válido' });
  res.json({ nombre: buzton.nombre, items: buzton.items || [] });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check para plataformas de hosting
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  const data = loadData();
  console.log(`\n💌 AmongUs Secreto - Buzón digital`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   ${data.buzzones.length} buzones listos`);
  if (data.buzzones.length > 0) {
    console.log(`   Admin: /admin.html | Clave: ${data.adminKey}\n`);
  } else console.log('');
});
