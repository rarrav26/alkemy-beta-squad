using System;
using System.Collections.Generic;

namespace DigitalArs.Api.Data.Entities;

public partial class Tarjeta
{
    public int id { get; set; }

    public int cuenta_id { get; set; }

    public string numero { get; set; } = null!;

    // DateOnly y no DateTime: la columna es DATE y la tarjeta no vence a una hora.
    public DateOnly vencimiento { get; set; }

    public string cvv { get; set; } = null!;

    // ACTIVA, CONGELADA o DADA_DE_BAJA. Los valores válidos y las transiciones permitidas
    // están en Helpers/Domain/EstadoDeTarjeta.
    public string estado { get; set; } = null!;

    public DateTime fecha_alta { get; set; }

    // Solo tiene valor cuando el estado es DADA_DE_BAJA.
    public DateTime? fecha_baja { get; set; }

    public virtual Cuenta cuenta { get; set; } = null!;
}
