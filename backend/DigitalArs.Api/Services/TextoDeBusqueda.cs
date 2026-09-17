using System.Globalization;
using System.Text;

namespace DigitalArs.Api.Services;

/* Deja un texto listo para comparar: en minúsculas, sin acentos y sin espacios de sobra.
   Hace falta porque la base usa la collation Modern_Spanish_CI_AS, que ignora las mayúsculas
   pero NO los acentos: el 'depósito' que escribe el usuario no coincidiría con el 'DEPOSITO'
   que está guardado. Normalizando los dos lados antes de compararlos, el acento deja de
   importar y el usuario puede escribir el término como quiera. */
public static class TextoDeBusqueda
{
    public static string Normalizar(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return string.Empty;

        var sinAcentos = QuitarAcentos(texto);

        return sinAcentos.ToLowerInvariant().Trim();
    }

    // FormD separa cada letra acentuada en dos caracteres, la letra y la marca del acento.
    // Descartando las marcas queda la letra sola: 'á' termina en 'a'.
    private static string QuitarAcentos(string texto)
    {
        var separado = texto.Normalize(NormalizationForm.FormD);
        var sinMarcas = new StringBuilder();

        foreach (var caracter in separado)
        {
            if (EsMarcaDeAcento(caracter))
                continue;

            sinMarcas.Append(caracter);
        }

        return sinMarcas.ToString().Normalize(NormalizationForm.FormC);
    }

    private static bool EsMarcaDeAcento(char caracter) =>
        CharUnicodeInfo.GetUnicodeCategory(caracter) == UnicodeCategory.NonSpacingMark;
}
