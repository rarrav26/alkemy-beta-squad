using DigitalArs.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Data.Context;

/* -----------------------------------------------------------------------------
   Notificaciones: la única parte del modelo que se mantiene a mano
   -----------------------------------------------------------------------------
   DigitalArsDbContext.cs y las cuatro entidades de Data/Entities las GENERA
   `dotnet ef dbcontext scaffold --force` (ver el README del backend). Todo lo que
   se escriba dentro de esos archivos se pierde en el próximo scaffolding.

   Por eso la tabla Notificaciones se configura acá, en una clase partial, usando
   el punto de extensión que el propio generador deja preparado:
   DigitalArsDbContext.cs declara `partial void OnModelCreatingPartial` y lo llama
   al final de OnModelCreating, justamente para esto. Así un `--force` regenera lo
   suyo y esta configuración sigue en pie.

   CONSECUENCIA IMPORTANTE
   La tabla Notificaciones NO va en los --table del comando de scaffolding. Si se
   la incluye, el generador crea una segunda entidad y un segundo DbSet para la
   misma tabla y el proyecto deja de compilar por duplicados. Además la llamaría
   `Notificacione`: su pluralizador es inglés y no sabe singularizar en español.
   ----------------------------------------------------------------------------- */
public partial class DigitalArsDbContext
{
    public virtual DbSet<Notificacion> Notificaciones { get; set; }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notificacion>(entity =>
        {
            entity.ToTable("Notificaciones");

            entity.HasKey(e => e.id).HasName("PK_Notificaciones");

            // titulo y mensaje son NVARCHAR en la base, que es lo que EF Core usa
            // por defecto para un string: no hace falta IsUnicode(false) como en
            // Cuenta.alias, que sí es VARCHAR.
            entity.Property(e => e.titulo).HasMaxLength(100);
            entity.Property(e => e.mensaje).HasMaxLength(300);

            // DATETIME2(3), igual que Movimiento.fecha.
            entity.Property(e => e.fecha).HasPrecision(3);

            // El DEFAULT (0) de la columna leida no se declara a propósito, igual
            // que el generador tampoco declara el DEFAULT (0) de Cuentas.saldo:
            // cuando el valor por defecto de la base coincide con el de C# (false),
            // configurarlo haría que EF no pueda distinguir "no lo seteé" de
            // "lo seteé en false", y dejaría de poder guardar un false explícito.

            // Las dos claves foráneas (usuario_id, movimiento_id) no se configuran:
            // la entidad no tiene navegaciones, así que para EF son enteros
            // comunes. Las sigue haciendo cumplir SQL Server, que es donde están
            // declaradas. No declararlas acá es lo que evita tocar Usuario.cs y
            // Movimiento.cs, que son archivos generados.
        });
    }
}
