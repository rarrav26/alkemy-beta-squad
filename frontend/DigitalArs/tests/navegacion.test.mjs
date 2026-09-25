import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PESTANAS_DE_MOBILE,
  PESTANAS_DE_MOBILE_DEL_ADMIN,
  SECCIONES_DEL_MENU_MAS,
  SECCIONES_DEL_MENU_MAS_DEL_ADMIN,
  SECCIONES_DE_ESCRITORIO,
  SECCIONES_DE_ESCRITORIO_DEL_ADMIN,
  SECCION_CUENTAS,
  SECCION_INICIO,
  SECCION_MAS,
  SECCION_MOVIMIENTOS,
  SECCION_NUEVO_USUARIO,
  SECCION_PERFIL,
  SECCION_TARJETAS,
  SECCION_USUARIOS,
  pestanasDeMobile,
  seccionActivaDeLaRuta,
  seccionActivaDeLaRutaEnEscritorio,
  seccionesDeEscritorio,
  seccionesDelMenuMas
} from '../src/routes/navegacionUtils.js'

// Todas las listas de secciones, para las pruebas que valen para cualquiera de ellas.
const TODAS_LAS_LISTAS = {
  'pestañas de mobile': PESTANAS_DE_MOBILE,
  'pestañas de mobile del admin': PESTANAS_DE_MOBILE_DEL_ADMIN,
  'menú Más': SECCIONES_DEL_MENU_MAS,
  'menú Más del admin': SECCIONES_DEL_MENU_MAS_DEL_ADMIN,
  'barra lateral': SECCIONES_DE_ESCRITORIO,
  'barra lateral del admin': SECCIONES_DE_ESCRITORIO_DEL_ADMIN
}

// Rutas que solo puede abrir el usuario regular: están detrás de Protected rol={ROL_USUARIO}.
const RUTAS_DE_BILLETERA = ['/cuentas', '/tarjetas', '/movimientos']

// --- Barra inferior (mobile) ---

test('el dashboard marca la pestaña Inicio', () => {
  assert.equal(seccionActivaDeLaRuta('/dashboard'), SECCION_INICIO)
})

test('la pantalla de cuentas marca la pestaña Cuentas', () => {
  assert.equal(seccionActivaDeLaRuta('/cuentas'), SECCION_CUENTAS)
})

test('la pantalla de tarjetas marca la pestaña Tarjetas', () => {
  assert.equal(seccionActivaDeLaRuta('/tarjetas'), SECCION_TARJETAS)
})

test('las rutas del menú Más marcan esa pestaña', () => {
  // Así el usuario sabe por dónde volver a entrar a la pantalla en la que está.
  assert.equal(seccionActivaDeLaRuta('/movimientos'), SECCION_MAS)
  assert.equal(seccionActivaDeLaRuta('/perfil'), SECCION_MAS)
})

test('una ruta que no está en la barra no marca ninguna pestaña', () => {
  assert.equal(seccionActivaDeLaRuta('/login'), null)
})

// --- Barra inferior del administrador ---

test('el administrador tiene sus propias pestañas en mobile', () => {
  const ids = PESTANAS_DE_MOBILE_DEL_ADMIN.map(pestana => pestana.id)

  assert.deepEqual(ids, [SECCION_INICIO, SECCION_USUARIOS, SECCION_NUEVO_USUARIO])
})

test('las rutas del administrador marcan pestaña solo para el administrador', () => {
  assert.equal(seccionActivaDeLaRuta('/admin/usuarios', true), SECCION_USUARIOS)
  assert.equal(seccionActivaDeLaRuta('/usuarios/nuevo', true), SECCION_NUEVO_USUARIO)
  assert.equal(seccionActivaDeLaRuta('/admin/usuarios', false), null)
})

test('en la barra del administrador, Perfil cae en el menú Más', () => {
  // Es su única sección fuera de la barra, así que el menú no le queda vacío: siempre tiene
  // Perfil y Cerrar sesión.
  assert.equal(seccionActivaDeLaRuta('/perfil', true), SECCION_MAS)
})

test('ninguna ruta de billetera marca pestaña para el administrador', () => {
  // Lo que protege: que no se le ofrezca navegar a pantallas que su rol no puede abrir. Un link
  // viejo a /tarjetas lo rebotaría a /dashboard, así que tampoco puede encenderle una pestaña.
  for (const ruta of RUTAS_DE_BILLETERA) {
    assert.equal(seccionActivaDeLaRuta(ruta, true), null, ruta)
  }
})

test('pestanasDeMobile y seccionesDelMenuMas devuelven la lista del rol', () => {
  assert.equal(pestanasDeMobile(true), PESTANAS_DE_MOBILE_DEL_ADMIN)
  assert.equal(pestanasDeMobile(false), PESTANAS_DE_MOBILE)
  assert.equal(seccionesDelMenuMas(true), SECCIONES_DEL_MENU_MAS_DEL_ADMIN)
  assert.equal(seccionesDelMenuMas(false), SECCIONES_DEL_MENU_MAS)
})

test('la barra inferior no dibuja más de cuatro pestañas', () => {
  // Tres secciones más "Más". Con cinco, MUI las comprime y la última queda cortada en un
  // teléfono de 360px — es el bug que ya arreglamos una vez.
  for (const esAdmin of [true, false]) {
    assert.ok(pestanasDeMobile(esAdmin).length <= 3, `${esAdmin} tiene demasiadas pestañas`)
  }
})

test('ninguna pestaña de mobile se llama "Más"', () => {
  // "Más" no es una sección: es la hoja con el resto, y la agrega la barra por su cuenta. Si
  // apareciera en la lista, saldría dos veces.
  for (const esAdmin of [true, false]) {
    const ids = pestanasDeMobile(esAdmin).map(pestana => pestana.id)
    assert.ok(!ids.includes(SECCION_MAS))
  }
})

// --- Barra lateral (escritorio) ---

test('en escritorio cada sección se marca a sí misma', () => {
  assert.equal(seccionActivaDeLaRutaEnEscritorio('/dashboard'), SECCION_INICIO)
  assert.equal(seccionActivaDeLaRutaEnEscritorio('/cuentas'), SECCION_CUENTAS)
  assert.equal(seccionActivaDeLaRutaEnEscritorio('/tarjetas'), SECCION_TARJETAS)
  assert.equal(seccionActivaDeLaRutaEnEscritorio('/perfil'), SECCION_PERFIL)
})

test('en escritorio Movimientos es su propia sección y no cae en "Más"', () => {
  // Es la diferencia con mobile: en la barra inferior no hay lugar para Movimientos, así que
  // vive adentro del menú "Más". En la barra lateral sí hay lugar y es una fila propia.
  assert.equal(seccionActivaDeLaRutaEnEscritorio('/movimientos'), SECCION_MOVIMIENTOS)
  assert.equal(seccionActivaDeLaRuta('/movimientos'), SECCION_MAS)
})

test('en escritorio no existe la sección "Más"', () => {
  for (const esAdmin of [true, false]) {
    const ids = seccionesDeEscritorio(esAdmin).map(seccion => seccion.id)
    assert.ok(!ids.includes(SECCION_MAS))
  }
})

test('una ruta fuera de la barra lateral no marca ninguna sección', () => {
  assert.equal(seccionActivaDeLaRutaEnEscritorio('/login'), null)
  assert.equal(seccionActivaDeLaRutaEnEscritorio('/admin/usuarios'), null)
})

test('seccionesDeEscritorio devuelve la lista del rol que corresponde', () => {
  assert.equal(seccionesDeEscritorio(true), SECCIONES_DE_ESCRITORIO_DEL_ADMIN)
  assert.equal(seccionesDeEscritorio(false), SECCIONES_DE_ESCRITORIO)
})

test('el administrador tiene sus propias secciones y no las de billetera', () => {
  const ids = SECCIONES_DE_ESCRITORIO_DEL_ADMIN.map(seccion => seccion.id)

  assert.ok(ids.includes(SECCION_USUARIOS))
  assert.ok(ids.includes(SECCION_NUEVO_USUARIO))
  assert.ok(!ids.includes(SECCION_CUENTAS))
  assert.ok(!ids.includes(SECCION_TARJETAS))
  assert.ok(!ids.includes(SECCION_MOVIMIENTOS))
})

test('ninguna ruta de billetera marca sección para el administrador en escritorio', () => {
  for (const ruta of RUTAS_DE_BILLETERA) {
    assert.equal(seccionActivaDeLaRutaEnEscritorio(ruta, true), null, ruta)
  }
})

test('Inicio y Mi perfil son las únicas secciones compartidas por los dos roles', () => {
  const delUsuario = SECCIONES_DE_ESCRITORIO.map(seccion => seccion.id)
  const delAdmin = SECCIONES_DE_ESCRITORIO_DEL_ADMIN.map(seccion => seccion.id)
  const compartidas = delAdmin.filter(id => delUsuario.includes(id))

  assert.deepEqual(compartidas.sort(), [SECCION_INICIO, SECCION_PERFIL].sort())
})

// --- Vale para todas las listas ---

test('ninguna lista tiene ids ni rutas repetidas', () => {
  // Un id repetido marcaría dos entradas a la vez; una ruta repetida haría que la función de
  // sección activa acierte siempre la primera y la otra nunca se encienda.
  for (const [nombre, lista] of Object.entries(TODAS_LAS_LISTAS)) {
    const ids = lista.map(seccion => seccion.id)
    const rutas = lista.map(seccion => seccion.to)

    assert.equal(new Set(ids).size, ids.length, `${nombre}: ids repetidos`)
    assert.equal(new Set(rutas).size, rutas.length, `${nombre}: rutas repetidas`)
  }
})

test('toda entrada de toda lista tiene id, etiqueta y ruta absoluta', () => {
  for (const [nombre, lista] of Object.entries(TODAS_LAS_LISTAS)) {
    for (const seccion of lista) {
      assert.ok(seccion.id?.length > 0, `${nombre}: entrada sin id`)
      assert.ok(seccion.etiqueta?.length > 0, `${nombre}: ${seccion.id} sin etiqueta`)
      assert.ok(seccion.to?.startsWith('/'), `${nombre}: ${seccion.id} con ruta '${seccion.to}'`)
    }
  }
})

test('toda sección se reconoce desde su propia ruta, en las dos cáscaras y los dos roles', () => {
  // Cierra el círculo: las listas que dibujan las barras y las funciones que marcan la entrada
  // activa leen los mismos datos, así que agregar una sección no puede dejarla sin encenderse.
  for (const esAdmin of [true, false]) {
    for (const seccion of pestanasDeMobile(esAdmin)) {
      assert.equal(seccionActivaDeLaRuta(seccion.to, esAdmin), seccion.id)
    }

    for (const seccion of seccionesDelMenuMas(esAdmin)) {
      assert.equal(seccionActivaDeLaRuta(seccion.to, esAdmin), SECCION_MAS)
    }

    for (const seccion of seccionesDeEscritorio(esAdmin)) {
      assert.equal(seccionActivaDeLaRutaEnEscritorio(seccion.to, esAdmin), seccion.id)
    }
  }
})

test('en mobile se llega a todas las secciones de escritorio, por la barra o por el menú', () => {
  // Lo que protege: que una sección nueva no quede alcanzable solo en escritorio. Toda ruta de la
  // barra lateral tiene que estar en las pestañas o en el menú "Más" del mismo rol.
  for (const esAdmin of [true, false]) {
    const enMobile = [...pestanasDeMobile(esAdmin), ...seccionesDelMenuMas(esAdmin)].map(s => s.to)

    for (const seccion of seccionesDeEscritorio(esAdmin)) {
      assert.ok(enMobile.includes(seccion.to), `${seccion.id} no se alcanza en mobile`)
    }
  }
})
