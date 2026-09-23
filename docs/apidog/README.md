# Colección de Apidog — flujos de la demo del backend

Prueba de punta a punta los flujos principales de la API contra la base local:
registro, login, perfil, depósito, transferencia, historial, administración y notificaciones.
Cada request trae sus aserciones (status, `code` de error y campos clave).

| Archivo | Qué es |
|---|---|
| `DigitalArs.postman_collection.json` | La colección: 10 carpetas, 37 requests |
| `DigitalArs-Local.postman_environment.json` | El entorno `DigitalArs Local`: `baseUrl`, credenciales y variables que se completan solas |

Están en formato Postman v2.1 porque Apidog los importa tal cual, con los scripts de
extracción del token y las aserciones.

Resultado esperado de una corrida completa: **37 requests y 70 aserciones en verde**.

## Antes de correrla

1. SQL Server con la base creada y los seeds aplicados (ver el README de la raíz): la carpeta
   de administración usa `admin@digitalars.com`, que crea `database/Seed(v.003).sql`.
2. La API levantada con el perfil `DigitalArs.Api` (`https://localhost:7201`). Para comprobarlo,
   abrir `https://localhost:7201/api/setup/status` en el navegador.
3. Certificado de desarrollo: confiar en él con `dotnet dev-certs https --trust`, o desactivar
   la verificación de certificados SSL en la configuración de Apidog.
4. Usar **Apidog de escritorio**. La versión web no llega a `localhost` sin su agente local.

## Paso 1 — Importar la colección

1. En el proyecto de Apidog: **Import → Postman**.
2. Elegir **los dos archivos juntos** (colección y entorno). Si se importan por separado,
   `{{baseUrl}}` y las demás variables no se resuelven.
3. En la pantalla **Import Preview & Configuration** se pueden dejar las opciones como vienen:
   - *Import into*: **Create a new module** (queda como "DigitalArs API — flujos de la demo").
   - *Import "e.g." in Postman as endpoint debug cases*: **activado**. Es lo que convierte cada
     request de la colección en un *debug case*, que después se usa en el escenario.
   - *Import Environment*: **activado**, con **DigitalArs Local** tildado.
   - Si ya se había importado antes, en *How to handle when the same resource already exists*
     elegir **Overwrite** en todo, así no quedan duplicados.
4. **Confirm**.
5. Arriba a la derecha, elegir el entorno **DigitalArs Local**.

## Paso 2 — Armar el Test Scenario

Apidog no corre la colección como un bloque: cada request queda como un caso suelto de su
endpoint. Para correr los flujos en orden hay que armar un escenario.

1. Ir a **Tests** (menú de la izquierda) → **Test Scenarios** → **+ New**.
2. Ponerle un nombre (por ejemplo `Flujo completo demo`) y **Continue**. Carpeta y prioridad no
   importan.
3. En el editor del escenario, **+** (agregar paso) → **Import from Endpoint Debug Case**.
   - Ojo: **Debug Case**, no *Test Case* ni *Spec*. Los requests importados de Postman quedan
     como debug cases; en *Import from Endpoint Test Case* las carpetas aparecen vacías, en `(0)`.
4. En el árbol, dentro de **DigitalArs API — flujos de la demo**, tildar los casos **en el orden
   de las carpetas, de 0 a 8**. El orden importa: cada paso usa variables que deja el anterior
   (el token, el alias de B, la invitación de C).
5. *Import Method*: **Copy** → **Add**.
6. En el panel de la derecha del escenario, elegir el entorno **DigitalArs Local** y **Save**.

## Paso 3 — Dos ajustes obligatorios después de importar

Sin estos ajustes la corrida da unas 14 fallas, aunque la API responda bien. Los cambios se
hacen **en los pasos del escenario** (no en los casos de la sección APIs: con el modo Copy, el
paso es una copia independiente) y hay que **guardar** antes de correr.

### 3.1 Desactivar la validación de respuesta en cada paso

Cada paso trae activada una validación automática contra la respuesta **"Success (200)"** del
endpoint. Esa respuesta la armó Apidog por defecto al importar, porque un archivo de Postman no
trae los status codes reales de cada endpoint. Por eso marca fallas como estas:

- `HTTP Code Error: Returned 201 while expected 200` (registro, alta de usuario).
- `Returned 400 / 401 / 403 / 404 / 409 while expected 200` (los casos de error, que son justo
  lo que se prueba).
- `The format of the response data is not JSON` (el 204 de desactivar y el 401 sin token no
  traen cuerpo, a propósito).

**Qué hacer:** en **cada paso** del escenario, desactivar la validación de respuesta (el selector
que dice **Success (200)**). La opción global del proyecto (*Settings → Response Validation*) no
alcanza: no se aplica a los casos ya guardados.

No se pierde nada: el status correcto de cada paso ya lo verifica su propio `pm.test`
(pestaña de post-procesadores del paso).

### 3.2 Revisar la autenticación de dos pasos

En la colección, estos dos pasos usan una autenticación distinta de la de su carpeta. Al
convertirlos, Apidog puede ignorar esa diferencia y ponerles la de la carpeta. Abrir cada uno
en el escenario → pestaña **Auth**:

| Paso | Auth que tiene que tener | Si quedó mal, pasa esto |
|---|---|---|
| 7. Usuario común en un endpoint de administración → 403 | **Bearer Token** con `{{token}}` (no `{{adminToken}}`) | Responde 200: se mandó con el token del administrador |
| 8. Consultar la cuenta sin token → 401 | **No Auth** | Responde 200: se mandó con un token |

Si la auth está en *Inherit from parent*, cambiarla a la opción explícita de la tabla.

Para confirmar qué se mandó de verdad, correr el paso solo y mirar la request enviada: en el paso
sin token no tiene que aparecer ningún header `Authorization`.

## Paso 4 — Correr

**Run** en el escenario. Tiene que terminar con 37 requests y 70 aserciones en verde. Para
repetirla, esperar un minuto (ver *Límite de solicitudes*).

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `Returned 201 while expected 200` y parecidos, aunque los `pm.test` del paso pasan | Validación automática contra la spec por defecto | Paso 3.1 |
| `The format of the response data is not JSON` en *Desactivar a C* o en el paso sin token | Misma validación: esas respuestas no traen cuerpo a propósito | Paso 3.1 |
| El paso de 403 responde 200 | Se mandó con `{{adminToken}}` | Paso 3.2 |
| El paso sin token responde 200 | Se mandó con un token | Paso 3.2 |
| Cambié la auth o la validación y sigue igual | Se editó el caso en APIs y no el paso del escenario, o no se guardó | Editar el paso dentro del escenario y **Save** |
| *Import from Endpoint Test Case* muestra todo en `(0)` | Los requests de Postman quedan como *debug cases* | Usar **Import from Endpoint Debug Case** |
| 429 en requests de `/api/auth` | Límite de 20 solicitudes por minuto | Esperar un minuto entre corridas |
| Error de certificado o conexión rechazada | Certificado sin confianza, API apagada o Apidog web | Ver *Antes de correrla* |
| El registro devuelve 400 en la primera corrida | No corrió *Estado de la instalación* primero: faltan los emails y DNI nuevos | Respetar el orden 0 a 8 |

## Cómo funciona la autenticación

- La colección usa **Bearer `{{token}}`**. El request *Login usuario A* lo guarda con
  `pm.environment.set("token", ...)`, y desde ahí todas las requests lo heredan.
- La carpeta **7. Administración** usa **Bearer `{{adminToken}}`**, que guarda *Login administrador*.
- Registro, login, primera contraseña y `setup/status` van sin autenticación, como en la API.
- *Usuario común en un endpoint de administración* usa `{{token}}` a propósito, para mostrar el 403.

## Datos de cada corrida

El primer request (*Estado de la instalación*) genera emails y DNI nuevos con la hora actual,
porque la base no permite repetirlos. Por eso la colección se puede correr muchas veces sin
limpiar la base: cada corrida crea tres usuarios nuevos (A, B y C).

| Usuario | Para qué |
|---|---|
| A | El protagonista: se registra, deposita 5000, transfiere 1500 y consulta su historial |
| B | El destino de la transferencia (su alias queda en `{{aliasB}}`) |
| C | El alta administrativa: invitación, primera contraseña y desactivación |

## Límite de solicitudes

Los endpoints de `/api/auth` aceptan 20 solicitudes por minuto por IP, y una corrida hace 10.
Dos corridas seguidas dentro del mismo minuto pueden terminar en 429: esperar un minuto entre
corridas.

## Correrla desde la terminal (opcional)

El mismo archivo se puede correr sin Apidog, con Newman. Acá no hacen falta los ajustes del
Paso 3: Newman respeta la autenticación de cada request y no valida contra ninguna spec.

```powershell
npx newman run DigitalArs.postman_collection.json -e DigitalArs-Local.postman_environment.json --insecure
```
