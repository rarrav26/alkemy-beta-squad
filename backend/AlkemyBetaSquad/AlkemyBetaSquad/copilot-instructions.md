# Backend — ASP.NET Core + EF Core + SQL Server

Perfil de quien programa: junior, principalmente JS/Node/SQL. El código en
C# debe ser tan explícito como pide la guía de abajo — nada de atajos que
asuman experiencia previa con .NET.

## Antes de escribir código

1. Es ASP.NET Core con EF Core (arranque `Program.cs` top-level), no .NET
   Framework clásico ni EF6. No sugerir sintaxis, paquetes ni patrones de
   esa versión anterior (por ejemplo `Startup.cs` + `Global.asax`, o
   `System.Data.Entity`).
2. La guía menciona "Database-First" y "migraciones EF" para el modelo de
   datos. Antes de tocar el esquema, preguntar cuál de los dos es el flujo
   real de este proyecto — no asumir ni mezclarlos.
3. No introducir una capa `Services/` salvo que ya exista o se pida
   explícitamente: la guía la deja como paso de escalado futuro, no parte
   de la base actual (Controller → Interface → Repository → DbContext).
4. Si hace falta crear una interfaz o un repositorio nuevo, revisar primero
   si ya existe uno equivalente en `Interfaces/` o `Repositories/`. No
   duplicar contratos.

## Filosofía de código — aplica a todo el repo

Estas reglas tienen prioridad sobre cualquier otra instrucción de generación.

- **Simple sobre inteligente.** Si dos soluciones resuelven lo mismo, elegir
  siempre la que un junior puede leer y entender sin que se la expliquen.
- **Nada de lógica anidada o compleja.** Evitar ternarios anidados,
  encadenamientos de más de un nivel y condicionales muy anidados. Separarlos
  en pasos con nombre propio.
- **Early return antes que anidar.** Validar y devolver error al principio
  del método. El camino feliz queda al final, con mínima indentación.
- **Una responsabilidad por método.** Si un método hace más de una cosa,
  se divide.
- **Nombres con significado.** Variables, métodos y archivos describen qué
  hacen. Nada de abreviaturas salvo las universales (id, req, res, err).
  Nada de variables de una sola letra salvo en scopes muy chicos (`i` en un
  `for`).
- **Comentarios solo cuando hacen falta.** Comentar el POR QUÉ, nunca el QUÉ.
  Si hace falta un comentario para explicar qué hace el código, reescribirlo
  para que sea más claro en vez de comentarlo.
- **Escalable y modular.** Cada archivo tiene un propósito claro. La lógica
  reutilizable va en un método o clase compartida, nunca duplicada.
- **Formato consistente.** Misma estructura en todos los archivos del mismo
  tipo: todos los Controllers se parecen entre sí, todos los Repositories
  también.

## SOLID, aplicado con criterio

- Depender de interfaces en el constructor solo si ya existen en el proyecto
  o si hay una razón concreta (tests, más de una implementación real). No
  crear una interfaz por cada clase nueva "por las dudas" — eso es
  sobreingeniería, no SOLID.
- Una clase (Controller, Repository) mantiene una sola responsabilidad. Si
  un Repository empieza a mandar emails o a loguear a un servicio externo,
  esa lógica va en otro lado, no ahí.

---

# Guía base reutilizable para APIs REST en .NET (EF Core + SQL Server)

## Objetivo
Este documento resume una **base arquitectónica reutilizable** para proyectos backend API REST en .NET, tomando como referencia la estructura actual, pero sin depender del dominio concreto del proyecto.

---

## 1) Arquitectura general

### Estilo
- **Arquitectura en capas simple (vertical por responsabilidad)**:
  - **Controllers**: capa HTTP (endpoints, códigos de estado, binding de request).
  - **Dtos**: contratos de entrada/salida hacia API.
  - **Interfaces**: contratos de acceso a datos (abstracciones).
  - **Repositories**: implementación de persistencia.
  - **Data**: `DbContext` y entidades EF Core.

### Patrones aplicados
- **Repository Pattern** para desacoplar la lógica de acceso a datos del controlador.
- **Dependency Injection (DI)** nativa de ASP.NET Core para intercambiar implementaciones sin tocar controladores.
- **DTO + Validación con DataAnnotations** para validar entrada de forma declarativa.
- **Database-First con EF Core** (entidades y mapeo alineados a SQL Server existente).

---

## 2) Estructura de carpetas recomendada

```text
/
├─ Controllers/              # Endpoints REST
├─ Dtos/                     # Contratos de request/response
├─ Interfaces/               # Contratos (repositorios/servicios)
├─ Repositories/             # Implementaciones de acceso a datos
├─ Data/
│  ├─ Entities/              # Entidades EF Core
│  └─ *DbContext.cs          # Contexto de base de datos
├─ Properties/
├─ appsettings.json
├─ Program.cs                # Bootstrap y composición de dependencias
└─ *.csproj
```

Regla práctica:
- Las dependencias deben fluir **de fuera hacia dentro** (Controller -> Interface -> Repository -> DbContext).
- Evitar que un Controller acceda directamente al `DbContext`.

---

## 3) Convenciones de código

### Convenciones de nombres
- **Controllers**: `<Recurso>Controller`.
- **DTOs**: `Save<Recurso>Dto`, `<Recurso>ResponseDto`, etc.
- **Interfaces**: prefijo `I` (`I<Recurso>Repository`).
- **Repositorios**: `<Recurso>Repository`.
- **DbContext**: `<NombreDominio>DbContext`.
- Si un nombre colisiona con tipos del framework (ej. `Task`), usar prefijo/sufijo explícito (`ETask`, `TaskEntity`).

### Convenciones de endpoints REST
- `GET /api/<recurso>` -> listado.
- `GET /api/<recurso>/{id}` -> detalle.
- `POST /api/<recurso>` -> creación (`201 Created` + `CreatedAtAction`).
- `PUT /api/<recurso>/{id}` -> actualización (`204 NoContent` o `404`).
- `DELETE /api/<recurso>/{id}` -> borrado (`204 NoContent` o `404`).

### Convenciones de validación
- Validar request con **DataAnnotations** en DTOs:
  - `[Required]`, `[StringLength]`, etc.
- Mantener reglas de negocio fuera del controlador cuando escale el proyecto (mover a servicios de aplicación).

---

## 4) Persistencia y acceso a datos

### EF Core + SQL Server
- Registrar `DbContext` en `Program.cs` con `UseSqlServer(...)`.
- Mantener configuración sensible en `appsettings.json` (`ConnectionStrings`).
- Combinar mapeo por atributos y/o Fluent API en `OnModelCreating`.

### Reglas de repositorio
- Exponer operaciones CRUD con tipos concretos del dominio persistente (entidades).
- Evitar lógica HTTP en repositorios.
- Confirmar persistencia con `SaveChanges()`.

---

## 5) Configuración y composición (Program.cs)

Base recomendada:
- `AddControllers()`.
- Registro de OpenAPI/Swagger para documentación.
- Registro de `DbContext`.
- Registro de interfaces con implementaciones (`AddScoped`).
- Pipeline mínimo: HTTPS, autorización (si aplica), mapeo de controladores.

---

## 6) Dependencias mínimas típicas

Para este tipo de stack:
- `Microsoft.EntityFrameworkCore.SqlServer`
- `Microsoft.EntityFrameworkCore.Design`
- `Microsoft.EntityFrameworkCore.Tools`
- `Microsoft.AspNetCore.OpenApi`
- `Swashbuckle.AspNetCore` (o UI equivalente)

Regla:
- Preferir dependencias del ecosistema oficial .NET y mantener versiones alineadas al `TargetFramework`.

---

## 7) Reglas de extensibilidad para futuros proyectos

1. **Agregar un nuevo recurso**
   - Crear entidad en `Data/Entities`.
   - Crear DTOs en `Dtos`.
   - Crear interfaz en `Interfaces`.
   - Crear repositorio en `Repositories`.
   - Crear controller con endpoints REST consistentes.
   - Registrar dependencias en `Program.cs`.

2. **Escalar sin romper estructura**
   - Introducir capa `Services/` para casos de uso complejos.
   - Mantener Controllers delgados (orquestación HTTP únicamente).
   - Centralizar manejo de errores con middleware/filtros.

3. **Estandarización de respuestas**
   - Mantener códigos HTTP correctos y consistentes.
   - Documentar contratos mediante OpenAPI.

4. **Evolución técnica**
   - Cuando cambie el modelo de datos, preferir migraciones EF o proceso Database-First controlado.
   - Añadir pruebas (unitarias/integración) cuando la API crezca en reglas de negocio.

---

## 8) Estilo de desarrollo recomendado

- Código explícito y legible.
- Responsabilidades separadas por capa.
- Acoplamiento bajo mediante interfaces + DI.
- Validación de entrada en DTOs.
- Persistencia encapsulada en repositorios.
- Convenciones REST uniformes para todos los recursos.

Este enfoque permite usar la misma base como **plantilla de arranque** para nuevas APIs REST backend en .NET con EF Core y SQL Server.
