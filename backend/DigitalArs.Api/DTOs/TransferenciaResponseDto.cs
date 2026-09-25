namespace DigitalArs.Api.DTOs;

// Message y no Mensaje: es la misma clave que usan el depósito y el registro, y la que lee el front.
public record TransferenciaResponseDto(
    decimal SaldoActual,
    string Message = "Transferencia realizada con éxito.");
