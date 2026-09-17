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
