# Colección de Apidog — flujos de la demo del backend

Prueba de punta a punta los flujos principales de la API contra la base local:
registro, login, perfil, depósito, transferencia, historial y administración.
Cada request trae sus aserciones (status, `code` de error y campos clave).

| Archivo | Qué es |
|---|---|
| `DigitalArs.postman_collection.json` | La colección: 9 carpetas, 28 requests |
| `DigitalArs-Local.postman_environment.json` | El entorno `DigitalArs Local`: `baseUrl`, credenciales y variables que se completan solas |

Están en formato Postman v2.1 porque Apidog los importa tal cual, con los scripts de
extracción del token y las aserciones.

## Antes de correrla

1. SQL Server con la base creada y los seeds aplicados (ver el README de la raíz): la carpeta
   de administración usa `admin@digitalars.com`, que crea `database/Seed(v.003).sql`.
2. La API levantada con el perfil `DigitalArs.Api` (`https://localhost:7201`).
3. Certificado de desarrollo: confiar en él con `dotnet dev-certs https --trust`, o desactivar
   la verificación de certificados SSL en la configuración de Apidog.
4. Usar **Apidog de escritorio**. La versión web no llega a `localhost` sin su agente local.

## Importar

1. En el proyecto de Apidog: **Importar → Postman**, y elegir los dos archivos juntos, así se
   resuelven `{{baseUrl}}` y las demás variables.
2. Seleccionar el entorno **DigitalArs Local** arriba a la derecha.
3. Apidog convierte cada request en un caso del endpoint. Para correr los flujos en orden, crear
   un **Test Scenario** y agregar los casos respetando el orden de las carpetas (0 a 8).

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

El mismo archivo se puede correr sin Apidog, con Newman:

```powershell
npx newman run DigitalArs.postman_collection.json -e DigitalArs-Local.postman_environment.json --insecure
```
