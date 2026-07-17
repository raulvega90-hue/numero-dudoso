# Registro de Números Dudosos

Sistema para consultar y reportar números telefónicos dudosos, listo para desplegar en **Netlify**. Usa **Netlify Blobs** como base de datos, por lo que no necesitas configurar ningún servicio externo: la persistencia funciona automáticamente al desplegar.

## Estructura

```
index.html                      → Interfaz (consulta y reporte)
netlify/functions/numeros.mjs   → API / base de datos (Netlify Blobs)
netlify.toml                    → Configuración de Netlify
package.json                    → Dependencia @netlify/blobs
```

## API

| Método | Ruta                  | Descripción                                  |
|--------|-----------------------|----------------------------------------------|
| GET    | `/api/numeros`        | Lista todos los números registrados          |
| GET    | `/api/numeros?q=555`  | Busca por coincidencia parcial               |
| POST   | `/api/numeros`        | Agrega un reporte (JSON)                     |

Cuerpo del POST:

```json
{
  "numero": "5512345678",
  "agregadoPor": "María",
  "metodo": "Suplantación de banco",
  "descripcion": "Pedían el NIP por teléfono"
}
```

Si el número ya existe, el reporte se suma al historial (no se duplica el número). Con 3 o más reportes, la interfaz lo marca como **Alto riesgo**.

## Cómo desplegar

### Opción A — Desde GitHub (recomendada)
1. Sube esta carpeta a un repositorio de GitHub.
2. En [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → elige el repositorio.
3. Netlify detecta la configuración de `netlify.toml`. Haz clic en **Deploy**.

### Opción B — Con Netlify CLI
```bash
npm install
npx netlify login
npx netlify deploy --prod
```

### Probar en local
```bash
npm install
npx netlify dev
```
Abre `http://localhost:8888`. Netlify Dev simula Blobs localmente.

## Notas
- Los números se normalizan automáticamente (se eliminan espacios, guiones y paréntesis).
- El campo **Agregado por** es obligatorio; **método** y **descripción** son opcionales.
- Es un registro comunitario abierto: cualquiera puede agregar. Si más adelante quieres moderación o autenticación, se puede añadir Netlify Identity o una clave secreta en la función.
