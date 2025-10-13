# Configuración CORS para Google Cloud Storage

## Problema
Las imágenes del bucket `gol360-scrape-raw-prod` no cargan debido a que el navegador bloquea las peticiones por política CORS.

**Error:**
```
Access to image at 'https://storage.googleapis.com/gol360-scrape-raw-prod/...' from origin 'http://localhost:9000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solución: Configurar CORS en el Bucket

### Opción 1: Usando Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Navega a **Cloud Storage > Buckets**
3. Selecciona el bucket `gol360-scrape-raw-prod`
4. Ve a la pestaña **Permissions**
5. Haz clic en **Edit CORS configuration**
6. Pega la configuración JSON de abajo

### Opción 2: Usando gsutil (CLI)

1. Crea un archivo `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

2. Aplica la configuración:

```bash
gsutil cors set cors.json gs://gol360-scrape-raw-prod
```

3. Verifica la configuración:

```bash
gsutil cors get gs://gol360-scrape-raw-prod
```

### Opción 3: CORS Restrictivo (Producción)

Para producción, es mejor limitar los orígenes permitidos:

```json
[
  {
    "origin": [
      "http://localhost:9000",
      "http://localhost:5000",
      "https://tu-dominio-produccion.com",
      "https://gol360.com"
    ],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Headers"
    ],
    "maxAgeSeconds": 3600
  }
]
```

Aplicar:
```bash
gsutil cors set cors-restrictive.json gs://gol360-scrape-raw-prod
```

## Verificar que funciona

Después de aplicar CORS:

1. Espera 1-2 minutos para que se propague
2. Recarga la aplicación (Ctrl+Shift+R para forzar recarga)
3. Las imágenes deberían cargar sin errores

## Archivos que faltan (404)

Algunos archivos reportan 404:
- `heat_map_Full_recording.png` (ColoColo)
- `shot_map_Full_recording.png` (ColoColo)

Verifica que estos archivos existan en el bucket en la ruta correcta:
```
gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/
```

Para listar archivos:
```bash
gsutil ls gs://gol360-scrape-raw-prod/raw/VeteranosTunja2025/LibVsColo/ColoColo/
```

## Permisos del Bucket

Asegúrate también de que el bucket permita acceso público de lectura:

```bash
gsutil iam ch allUsers:objectViewer gs://gol360-scrape-raw-prod
```

O para objetos específicos:
```bash
gsutil acl ch -u AllUsers:R gs://gol360-scrape-raw-prod/raw/**
```

## Solución temporal: Proxy

Si no puedes modificar CORS del bucket, podemos crear un endpoint proxy en Firebase Functions que sirva las imágenes.

Ver: `functions/src/api/imageProxy.ts` (pendiente de crear)
