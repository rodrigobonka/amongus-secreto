# 💌 AmongUs Secreto - Buzón Digital

Sistema tipo amigo secreto digital. Cada participante tiene un buzón donde otros dejan mensajes, fotos, memes, links, etc. **Todo 100% anónimo** hasta el gran día.

## Cómo funciona

1. **El admin** abre `/admin.html` (clave: `amongus14`) y ve los códigos de los 12 buzones
2. Se hace el **sorteo** por fuera (como siempre)
3. A cada quien le das **dos códigos** en privado:
   - **Código de SUBIDA**: para meter cosas en el buzón de su amigue secreto
   - **Código de VISIÓN**: para ver su propio buzón
4. Del 9 al 13 de febrero **llenan los buzones** en `/subir.html`
5. El **14 de febrero** cada quien abre su buzón en `/ver.html` y descubre todo 💕

## Desplegar en la web

### Opción 1: Railway (recomendado)

1. Sube el proyecto a GitHub
2. Entra a [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Selecciona tu repositorio
4. En **Settings** → **Networking** → **Generate Domain**
5. ¡Listo! Tu app estará en `tu-proyecto.up.railway.app`

### Opción 2: Render

1. Sube el proyecto a GitHub
2. Entra a [render.com](https://render.com) → New → Web Service
3. Conecta tu repositorio
4. Build: `npm install` | Start: `npm start`
5. Create Web Service

> **Nota:** En Railway y Render el disco es efímero: al reiniciar se pierden `data.json` y `uploads/`. Para uso prolongado, usa un VPS con disco persistente.

### Opción 3: VPS (DigitalOcean, etc.)

```bash
git clone <tu-repo>
cd amongus14
npm install
npm start
```

Para que siga corriendo: `npm install -g pm2 && pm2 start server.js --name amongus`

## Instalación local

```bash
npm install
npm start
```

Abre http://localhost:3000

## Admin

- **URL:** `/admin.html`
- **Clave:** `amongus14`
- Los 12 buzones vienen preconfigurados

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (por defecto 3000) |
| `HOST` | Host de escucha (por defecto 0.0.0.0) |

## Archivos soportados

Imágenes, PDF, Word, audios, videos. Máximo 100MB por archivo.

## Stack

- Bootstrap 5.3
- Node.js + Express
- Multer (subida de archivos)
