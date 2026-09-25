using System;
using System.Collections.Generic;

namespace DigitalArs.Api.Data.Entities;

public partial class Movimiento
{
    public int id { get; set; }

    public int cuenta_id { get; set; }

    public int tipo_movimiento_id { get; set; }

    public decimal importe { get; set; }

    public DateTime fecha { get; set; }

    public int? transferencia_id { get; set; }

    // Con qué tarjeta se hizo el pago. Nullable porque solo los movimientos de tipo
    // PAGO_CON_TARJETA lo tienen: un depósito y una transferencia no salen de una tarjeta.
    // Mismo patrón que transferencia_id.
    //
    // Sin propiedad de navegación a Tarjeta a propósito: nadie necesita recorrerla desde acá, y
    // no declararla evita que este archivo (que lo genera el scaffolding) dependa de una
    // entidad escrita a mano.
    public int? tarjeta_id { get; set; }

    public virtual Cuenta cuenta { get; set; } = null!;

    public virtual Tipo_Movimiento tipo_movimiento { get; set; } = null!;
}
