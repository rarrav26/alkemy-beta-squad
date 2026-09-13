using System;
using System.Collections.Generic;

namespace DigitalArs.Api.Data.Entities;

public partial class Cuenta
{
    public int id { get; set; }

    public int usuario_id { get; set; }

    public string alias { get; set; } = null!;

    public string cvu { get; set; } = null!;

    public decimal saldo { get; set; }

    public virtual ICollection<Movimiento> Movimientos { get; set; } = new List<Movimiento>();

    public virtual Usuario usuario { get; set; } = null!;
}
