using System;
using System.Collections.Generic;

namespace DigitalArs.Api.Data.Entities;

public partial class Usuario
{
    public int id { get; set; }

    public string? identity_user_id { get; set; }

    public string nombre { get; set; } = null!;

    public string apellido { get; set; } = null!;

    public string tipo_documento { get; set; } = null!;

    public string nro_documento { get; set; } = null!;

    public string email { get; set; } = null!;

    public bool is_active { get; set; }

    public virtual Cuenta? Cuenta { get; set; }
}
