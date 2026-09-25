using System;

namespace DigitalArs.Api.Data.Entities;

// Un hecho registrado en la vida de una tarjeta, tal como está en dbo.TarjetaEventos.
//
// Append-only: un evento no se corrige ni se borra, igual que un Movimiento.
//
// Existe porque el ESTADO de la tarjeta dice cómo está hoy, y eso no permite saber cómo llegó
// hasta ahí. Una tarjeta ACTIVA pudo haber sido congelada y descongelada cinco veces, y sin
// esta tabla esa historia no queda en ninguna parte.
//
// NO va en Movimientos a propósito: estos eventos no mueven dinero. El detalle del razonamiento
// está en database/Create(v.004).sql.
public class TarjetaEvento
{
    public int id { get; set; }

    public int tarjeta_id { get; set; }

    // GENERADA, CONGELADA, DESCONGELADA o DADA_DE_BAJA. Los valores válidos están en
    // Helpers/Domain/TipoDeEventoDeTarjeta y los hace cumplir CK_TarjetaEventos_Tipo.
    public string tipo { get; set; } = null!;

    // En UTC, igual que Movimiento.fecha.
    public DateTime fecha { get; set; }
}
