# Prototipo BIM: visor IFC

Este proyecto forma parte de los recursos de la comunidad **BIM al toque** en Skool.
Puede ver mi comunidad aqui: https://www.skool.com/bim-al-toque-9649/about

Es un **prototipo base** pensado para que los miembros de la comunidad puedan
estudiar, probar y ampliar un visor BIM web a partir de esta estructura inicial.

Aplicación web basada en Vite, Three.js y That Open para visualizar modelos IFC.

## Requisitos

- Git
- Node.js (versión LTS recomendada)
- pnpm 9.15.0 o compatible

## Instalación

```bash
git clone URL_DEL_REPOSITORIO
cd Prototipo
pnpm install
```

## Ejecutar en desarrollo

```bash
pnpm dev
```

Abrir en el navegador la URL mostrada por Vite, normalmente `http://localhost:5173`.

## Verificar la compilación

```bash
pnpm build
```

## Vista previa de producción

```bash
pnpm preview
```

## Estructura principal

- `src/`: código fuente de la aplicación.
- `public/`: recursos públicos, incluidos los archivos WebAssembly de `web-ifc`.
- `package.json`: dependencias y comandos del proyecto.
- `pnpm-lock.yaml`: versiones exactas de las dependencias.

## Notas

No se versionan `node_modules/` ni `dist/`, porque son carpetas generadas localmente.

## Guía para alumnos principiantes

Estos pasos están pensados para un equipo Windows sin herramientas instaladas.

### 1. Instalar las herramientas

1. Instala **Git** desde [git-scm.com/download/win](https://git-scm.com/download/win).
   Durante la instalación puedes conservar las opciones recomendadas.
2. Instala **Node.js LTS** desde [nodejs.org](https://nodejs.org/).
3. Instala **Visual Studio Code** desde [code.visualstudio.com](https://code.visualstudio.com/), si deseas editar el proyecto.
4. Abre **PowerShell** o el terminal de Visual Studio Code y comprueba Git y Node.js:

   ```powershell
   git --version
   node --version
   ```

5. Activa pnpm mediante Corepack y selecciona la versión usada por este proyecto:

   ```powershell
   corepack enable
   corepack prepare pnpm@9.15.0 --activate
   pnpm --version
   ```

   Debe mostrarse `9.15.0` o una versión compatible.

### 2. Clonar el repositorio

En PowerShell, ve a la carpeta donde quieras guardar el proyecto. Por ejemplo:

```powershell
cd $HOME\Documents
git clone https://github.com/alexiVera/Prototipo-visor-bim-comunidad.git
cd Prototipo-visor-bim-comunidad
```

`git clone` descarga una copia del proyecto en el equipo.

### 3. Instalar las dependencias

Dentro de la carpeta del proyecto, ejecuta:

```powershell
pnpm install
```

Este comando lee `package.json` y `pnpm-lock.yaml` y descarga las librerías necesarias. Puede tardar unos minutos la primera vez.

### 4. Levantar el visor

Ejecuta:

```powershell
pnpm dev
```

Vite mostrará una dirección parecida a:

```text
http://localhost:5173/
```

Copia esa dirección en Chrome, Edge o Firefox. Para detener el servidor, vuelve al terminal y pulsa `Ctrl + C`.

### 5. Comprobar que el proyecto compila

Opcionalmente, ejecuta:

```powershell
pnpm build
```

Si termina sin errores, el proyecto se compiló correctamente.

### Problemas frecuentes

- Si aparece `git no se reconoce`, cierra y vuelve a abrir PowerShell después de instalar Git.
- Si aparece `pnpm no se reconoce`, cierra y vuelve a abrir el terminal y repite `corepack enable`.
- Si el puerto `5173` está ocupado, Vite mostrará otra dirección disponible.
- No es necesario descargar `node_modules` desde GitHub: `pnpm install` lo crea automáticamente.
