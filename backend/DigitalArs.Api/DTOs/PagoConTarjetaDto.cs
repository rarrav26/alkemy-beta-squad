using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.Helpers.Domain;

namespace DigitalArs.Api.DTOs;

// Un pago con tarjeta va a un DESTINO REAL, identificado por alias o CVU, igual que una
// transferencia. No es un atajo: cuando alguien paga con tarjeta en un kiosco, la plata termina
// en la cuenta bancaria del kiosco. Acá el comercio es una cuenta de DigitalArs, así que el
// dinero se mueve de verdad y el pago se puede verificar.
//
// Implementa IValidatableObject igual que TransferenciaDto, para validar el FORMATO del destino
// antes de tocar la base: un destino mal escrito se rechaza con 400 y un mensaje claro, en vez
// de buscarlo y reportar "no existe".
public class PagoConTarjetaDto : IValidatableObject
{
    /// <summary>Alias o CVU del comercio que recibe el pago.</summary>
    /// <example>kiosco.la.esquina</example>
    [Required(ErrorMessage = "El destino es obligatorio.")]
    public string? Destino { get; set; }

    // decimal? y no decimal por el mismo motivo que DepositoDto y TransferenciaDto: con un
    // decimal común, un cuerpo sin importe llegaría como 0 y el mensaje hablaría del importe
    // cero en lugar de decir que falta.
    /// <summary>Importe a pagar. Se descuenta del saldo de la cuenta.</summary>
    /// <example>1500.50</example>
    [Required(ErrorMessage = "El importe es obligatorio.")]
    public decimal? Importe { get; set; }

    /// <summary>Concepto del pago. Opcional.</summary>
    /// <example>Compra en kiosco</example>
    [StringLength(100, ErrorMessage = "El concepto no puede superar los 100 caracteres.")]
    public string? Concepto { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // Se normaliza antes de validar, igual que en TransferenciaDto: los alias se guardan en
        // minúsculas, así que escribir "Kiosco.La.Esquina" tiene que aceptarse.
        var destino = DatosDeCuenta.NormalizarAlias(Destino);

        if (destino.Length > 0 && !DatosDeCuenta.EsDestinoValido(destino))
        {
            yield return new ValidationResult(
                "El destino tiene que ser un alias válido o un CVU de 22 dígitos.",
                [nameof(Destino)]);
        }
    }
}
