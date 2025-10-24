# ✅ Migración Completada: Todo en `gol360-app`

## Resumen de Cambios

Hemos migrado toda la infraestructura para usar **un solo proyecto de Firebase**: `gol360-app`

Esto significa que:
- ✅ El scraper escribe en Firestore de `gol360-app`
- ✅ Las Cloud Functions procesan datos en `gol360-app`
- ✅ El frontend lee de `gol360-app`
- ✅ Todo usa el mismo bucket de Cloud Storage

---

## Archivos Modificados

### 1. **ingest/src/scrape.js** - Línea 70
```javascript
// ANTES
const db = new Firestore({
  projectId: "gol360-api-dev",
  ...
});

// AHORA
const db = new Firestore({
  projectId: "gol360-app",  // MISMO PROYECTO QUE EL FRONTEND
  ...
});
```

### 2. **functions/processMatchData.js** - Líneas 12 y 20
```javascript
// ANTES
const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
});

const CONFIG = {
  bucket: process.env.RAW_BUCKET || 'gol360-scrape-raw-prod',
  ...
};

// AHORA
const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'gol360-app'
});

const CONFIG = {
  bucket: process.env.RAW_BUCKET || 'gol360-app.appspot.com',
  ...
};
```

### 3. **ingest/.env** - Líneas 3-4
```bash
# ANTES
RAW_BUCKET=gol360-scrape-raw-prod
SESSION_BUCKET=gol360-scrape-raw-prod

# AHORA
RAW_BUCKET=gol360-app.appspot.com
SESSION_BUCKET=gol360-app.appspot.com
```

---

## Pasos Siguientes para Completar la Migración

### 1. Verificar el Bucket en Firebase

```bash
# Verificar que el bucket existe
gsutil ls gs://gol360-app.appspot.com/

# Si no existe, créalo desde Firebase Console:
# 1. Ir a https://console.firebase.google.com
# 2. Seleccionar proyecto "gol360-app"
# 3. Storage > Get Started
```

### 2. Configurar CORS en el Bucket (para descargar tracking desde frontend)

Crear archivo `storage-cors.json`:
```json
[
  {
    "origin": ["https://gol360.app", "http://localhost:9000", "http://localhost:5173"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

Aplicar CORS:
```bash
gsutil cors set storage-cors.json gs://gol360-app.appspot.com
```

### 3. Deploy Cloud Functions al Proyecto Correcto

```bash
# Cambiar al directorio de functions
cd functions/

# Asegurarse de que estamos en el proyecto correcto
firebase use gol360-app

# Verificar que estamos en el proyecto correcto
firebase projects:list

# Deploy SOLO la nueva función
firebase deploy --only functions:processMatchData

# Ver logs para verificar
firebase functions:log --only processMatchData
```

### 4. Actualizar Firestore Rules (si es necesario)

Las reglas ya están en `api/firestore.rules`, pero ahora deben aplicarse al proyecto `gol360-app`:

```bash
cd api/

# Verificar proyecto activo
firebase use gol360-app

# Deploy rules
firebase deploy --only firestore:rules
```

### 5. Migrar Datos Existentes (OPCIONAL)

Si ya tienes datos en `gol360-api-dev` que quieres migrar:

```bash
# Exportar desde gol360-api-dev
gcloud firestore export gs://gol360-api-dev-backup/exports/2025-10-23 \
  --project=gol360-api-dev

# Importar a gol360-app
gcloud firestore import gs://gol360-api-dev-backup/exports/2025-10-23 \
  --project=gol360-app
```

**NOTA**: Solo hazlo si realmente necesitas los datos viejos. Para empezar desde cero, salta este paso.

---

## Testing de la Migración

### Test 1: Verificar Scraper Local

```bash
cd ingest/

# Test local (sin subir a GCS)
SKIP_GCS=true npm start

# Verificar que se conecta a gol360-app
# Deberías ver logs como:
# [scrape] Looking for specific job ID: ...
# [scrape] Found most recent job: ...
```

### Test 2: Subir Archivo de Prueba a GCS

```bash
# Crear archivo de prueba
cd ingest/output/

# Subir match-data.json
gsutil cp Veteranos2025_JenesanoVsTibana_2025-10-23T14-11-57.877Z.json \
  gs://gol360-app.appspot.com/raw/Veteranos2025/JenesanoVsTibana/match-data.json

# Verificar que se subió
gsutil ls gs://gol360-app.appspot.com/raw/Veteranos2025/JenesanoVsTibana/
```

### Test 3: Verificar Cloud Function

```bash
# Ver logs de la función
firebase functions:log --only processMatchData --project gol360-app

# Deberías ver:
# [processMatchData] Processing: raw/Veteranos2025/JenesanoVsTibana/match-data.json
# [processMatchData] Data loaded: { tournamentId: 'Veteranos2025', ... }
# [saveMatchData] ✓ Match metadata saved
# ...
```

### Test 4: Verificar Firestore

```bash
# Desde Firebase Console
# 1. Ir a https://console.firebase.google.com
# 2. Proyecto: gol360-app
# 3. Firestore Database
# 4. Navegar a: tournaments/Veteranos2025/matches/JenesanoVsTibana

# O desde CLI
firebase firestore:get tournaments/Veteranos2025/matches/JenesanoVsTibana --project gol360-app
```

### Test 5: Verificar desde Frontend

Una vez deployed las functions, el frontend debería poder leer los datos directamente sin cambios adicionales, ya que está configurado para `gol360-app`.

---

## Estructura Final

```
Proyecto Firebase: gol360-app
├── Firestore Database
│   ├── scrape_jobs/           (jobs del scraper)
│   ├── tournaments/
│   │   └── {tournamentId}/
│   │       └── matches/
│   │           └── {matchId}/
│   │               ├── (metadata)
│   │               ├── stats/
│   │               ├── shotMaps/
│   │               ├── heatMaps/
│   │               ├── playerMoments/
│   │               ├── highlights/
│   │               └── tracking/
│   ├── teams/                 (del frontend)
│   ├── matches/               (del frontend)
│   └── users/                 (del frontend)
│
├── Cloud Storage (gol360-app.appspot.com)
│   ├── raw/
│   │   └── {tournamentId}/
│   │       └── {matchId}/
│   │           ├── match-data.json
│   │           ├── player-tracking.json
│   │           └── player-tracking-meta.json
│   └── sessions/
│       └── veo_storage_state.json
│
└── Cloud Functions
    ├── processMatchData        (procesa match-data.json)
    ├── parseVeo               (legacy - procesa HTML)
    └── processScrapedData     (legacy)
```

---

## Ventajas de Esta Configuración

✅ **Simplicidad**: Un solo proyecto para todo
✅ **Frontend sin cambios**: Ya está configurado para `gol360-app`
✅ **Permisos simplificados**: Todo en el mismo proyecto
✅ **Costos centralizados**: Fácil ver usage en un solo lugar
✅ **Debugging más fácil**: Logs y datos en un solo sitio

---

## Comandos Útiles

### Ver todos los buckets del proyecto
```bash
gsutil ls -p gol360-app
```

### Ver contenido del bucket
```bash
gsutil ls -r gs://gol360-app.appspot.com/raw/
```

### Ver logs de Cloud Functions
```bash
firebase functions:log --project gol360-app
```

### Verificar proyecto activo de Firebase CLI
```bash
firebase projects:list
firebase use
```

### Cambiar de proyecto
```bash
firebase use gol360-app
```

---

## Troubleshooting

### Error: "Permission denied" al subir a GCS
**Solución**: Verifica que tienes permisos en el proyecto `gol360-app`:
```bash
gcloud auth list
gcloud config set project gol360-app
```

### Error: "Bucket does not exist"
**Solución**: Crea el bucket desde Firebase Console o con gcloud:
```bash
gsutil mb -p gol360-app gs://gol360-app.appspot.com
```

### Error: "Function not found: processMatchData"
**Solución**: Deploy la función al proyecto correcto:
```bash
cd functions/
firebase use gol360-app
firebase deploy --only functions:processMatchData
```

### Cloud Function no se dispara
**Solución**: Verifica que el trigger está configurado para el bucket correcto:
- El archivo debe subirse a `gs://gol360-app.appspot.com/`
- El path debe ser exactamente: `raw/{tournamentId}/{matchId}/match-data.json`

---

## Rollback (si algo sale mal)

Si necesitas volver a la configuración anterior:

1. **Revertir scrape.js**:
```javascript
projectId: "gol360-api-dev"
```

2. **Revertir processMatchData.js**:
```javascript
projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
bucket: process.env.RAW_BUCKET || 'gol360-scrape-raw-prod'
```

3. **Revertir .env**:
```bash
RAW_BUCKET=gol360-scrape-raw-prod
SESSION_BUCKET=gol360-scrape-raw-prod
```

---

## Próximos Pasos

Una vez verificado que todo funciona:

1. ✅ **Fase 1 completada**: Backend subiendo a Firestore ✓
2. 🔲 **Fase 2**: Configurar CORS en Cloud Storage
3. 🔲 **Fase 3**: Crear servicios en frontend
4. 🔲 **Fase 4**: Crear composables Vue
5. 🔲 **Fase 5**: Crear componentes de visualización

**¿Listo para continuar con Fase 2?**
