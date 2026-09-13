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

    public virtual Cuenta cuenta { get; set; } = null!;

    public virtual Tipo_Movimiento tipo_movimiento { get; set; } = null!;
}
