using System;
using System.Collections.Generic;

namespace DigitalArs.Api.Data.Entities;

public partial class Tipo_Movimiento
{
    public int id { get; set; }

    public string descripcion { get; set; } = null!;

    public virtual ICollection<Movimiento> Movimientos { get; set; } = new List<Movimiento>();
}
