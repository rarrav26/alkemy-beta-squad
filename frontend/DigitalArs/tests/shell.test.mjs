import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SHELL_CLASICO,
  SHELL_ESCRITORIO,
  SHELL_MOBILE,
  shellQueCorresponde
} from '../src/routes/shellUtils.js'

// Atajo para no repetir las dos claves en cada caso.
function shell({ sesionActiva = true, esPantallaChica = false } = {}) {
  return shellQueCorresponde({ sesionActiva, esPantallaChica })
}

test('con sesión, la pantalla ancha usa la cáscara de escritorio', () => {
  assert.equal(shell({ esPantallaChica: false }), SHELL_ESCRITORIO)
})

test('con sesión, la pantalla chica usa la cáscara mobile', () => {
  assert.equal(shell({ esPantallaChica: true }), SHELL_MOBILE)
})

test('sin sesión activa va la clásica, aunque la pantalla sea ancha', () => {
  // Es el caso del login y del rato en que la sesión todavía se está verificando contra el
  // servidor: no hay secciones que navegar.
  assert.equal(shell({ sesionActiva: false, esPantallaChica: false }), SHELL_CLASICO)
  assert.equal(shell({ sesionActiva: false, esPantallaChica: true }), SHELL_CLASICO)
})

test('el rol no entra en la decisión de la cáscara', () => {
  // Lo que protege: que nadie vuelva a meter el rol acá. Las dos cáscaras nuevas atienden a los
  // dos roles, porque ninguna es una lista fija de pantallas — cada barra recorre la lista de
  // secciones del rol que corresponda (ver navegacionUtils). Pasar un esAdmin, con cualquier
  // valor, no puede cambiar el resultado.
  for (const esPantallaChica of [true, false]) {
    const conAdminTrue = shellQueCorresponde({ sesionActiva: true, esAdmin: true, esPantallaChica })
    const conAdminFalse = shellQueCorresponde({ sesionActiva: true, esAdmin: false, esPantallaChica })
    const sinElDato = shell({ esPantallaChica })

    assert.equal(conAdminTrue, sinElDato)
    assert.equal(conAdminFalse, sinElDato)
  }
})

test('siempre devuelve exactamente una de las tres cáscaras', () => {
  // Lo que esta prueba cuida es que no haya un camino que devuelva undefined: App dibuja la
  // clásica en el `else`, así que un valor inesperado no explotaría, se vería como una pantalla
  // con la navegación equivocada.
  const cascarasPosibles = [SHELL_CLASICO, SHELL_MOBILE, SHELL_ESCRITORIO]

  for (const sesionActiva of [true, false]) {
    for (const esPantallaChica of [true, false]) {
      const resultado = shell({ sesionActiva, esPantallaChica })
      assert.ok(cascarasPosibles.includes(resultado), `devolvió ${resultado}`)
    }
  }
})
