namespace DigitalArs.Api.Helpers.Domain;

// El nombre de una persona tal como lo lee la otra: en la confirmación del destino de una
// transferencia, en el texto de los avisos y en el historial. Está en un solo lugar para que
// todas las pantallas escriban el nombre igual.
public static class NombreDelTitular
{
    public static string Completo(string nombre, string apellido) =>
        $"{nombre} {apellido}";
}
