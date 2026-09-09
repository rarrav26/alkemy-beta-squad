# DigitalArs - Billetera Virtual

Solución monorepo para la billetera virtual DigitalArs desarrollada por Beta Squad.

---

## Estructura del Repositorio

* `backend/`: API REST desarrollada en ASP.NET Core 10 con Entity Framework Core.
* `frontend/`: Aplicación Single Page Application (SPA) en React con Vite y Material UI.
* `database/`: Scripts SQL DDL, diagramas entidad-relación y procedimientos.
* `docs/`: Documentación funcional, arquitectura, historias de usuario y acuerdos de sprint.

---

## Requisitos Previos

* [.NET 10 SDK](https://dotnet.microsoft.com/)
* [Node.js](https://nodejs.org/) (v20 o superior recomendado)
* [SQL Server](https://www.microsoft.com/sql-server) y SSMS / Azure Data Studio
* [Git](https://git-scm.com/)

---

## Flujo de Trabajo (Git Flow)

* `main`: Código productivo y estable. No se envían commits directos.
* `dev`: Rama de integración para el squad. Todo el trabajo diario converge acá.
* `feature/<id-tarea>-<descripcion>`: Ramas individuales derivadas de `dev` (ejemplo: `feature/hu-003-scaffold-ef`).

---

## Setup Inicial del Desarrollador

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/rarrav26/alkemy-beta-squad.git](https://github.com/rarrav26/alkemy-beta-squad.git)
   cd alkemy-beta-squad