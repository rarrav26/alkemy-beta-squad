namespace DigitalArs.Api.Helpers.Domain;

// Regla única del importe de un movimiento, sin base de datos. La usan el DTO para
// validar la entrada y el servicio para aplicarla como regla de negocio. El repositorio
// no la repite: solo persiste.
public static class LimitesDeImporte
{
    public const decimal SaldoMaximo = 9999999999999999.99m;

    public static string? PrimerErrorDe(decimal importe)
    {
        if (importe <= 0)
            return "El importe debe ser mayor a cero.";

        if (decimal.Round(importe, 2) != importe)
            return "El importe debe tener como máximo 2 decimales.";

        if (importe > SaldoMaximo)
            return "El importe supera el máximo permitido.";

        return null;
    }
}
