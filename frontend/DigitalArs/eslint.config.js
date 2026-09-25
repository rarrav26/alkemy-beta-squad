import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `dist` es la salida del build.
  //
  // Los archivos de `src/components/Fondo/` que llevan nombre de componente de React Bits
  // (SideRays, LightRays) son código de terceros copiado tal cual (ver el encabezado de cada uno).
  // Quedan fuera del lint a propósito y no "arreglados": mantenerlos idénticos al original es lo
  // que permite compararlos y actualizarlos cuando salga una versión nueva. Editarlos para que
  // pasen nuestras reglas convertiría cada actualización en un merge a mano. Lo que este proyecto
  // necesita adaptar vive en FondoDelSitio.jsx, que sí se lintea.
  globalIgnores([
    'dist',
    'src/components/Fondo/SideRays.jsx',
    'src/components/Fondo/LightRays.jsx'
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
