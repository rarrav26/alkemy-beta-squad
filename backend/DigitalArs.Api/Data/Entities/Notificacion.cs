namespace DigitalArs.Api.Data.Entities;

// Un aviso de actividad de la cuenta, tal como está guardado en dbo.Notificaciones.
//
// ESTA ENTIDAD SE ESCRIBE A MANO, NO LA GENERA EL SCAFFOLDING.
// El motivo completo está en Data/Context/DigitalArsDbContext.Notificaciones.cs.
//
// Las propiedades van en snake_case igual que las otras entidades, porque el
// scaffolding del proyecto corre con --use-database-names y así el modelo entero
// se lee igual, sea generado o escrito a mano.
//
// A propósito NO tiene propiedades de navegación (ni usuario ni movimiento):
// nadie necesita recorrerlas, y no declararlas es lo que permite no tocar
// Usuario.cs ni Movimiento.cs, que sí son archivos generados. Las dos claves
// foráneas las sigue haciendo cumplir SQL Server.
public class Notificacion
{
    public int id { get; set; }

    // A quién se le avisa. Es Usuarios.id, no el id de Identity.
    public int usuario_id { get; set; }

    // El movimiento que originó el aviso. De acá sale el tipo de evento sin
    // guardarlo de nuevo en esta tabla.
    public int movimiento_id { get; set; }

    public string titulo { get; set; } = null!;

    public string mensaje { get; set; } = null!;

    public bool leida { get; set; }

    // En UTC, igual que Movimiento.fecha.
    public DateTime fecha { get; set; }
}
