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

    // Varias y no una: la baja es lógica, así que las tarjetas dadas de baja se conservan.
    // A lo sumo UNA de esta colección está vigente, y eso lo garantiza el índice
    // UQ_Tarjetas_CuentaVigente en la base.
    public virtual ICollection<Tarjeta> Tarjetas { get; set; } = new List<Tarjeta>();

    public virtual Usuario usuario { get; set; } = null!;
}
