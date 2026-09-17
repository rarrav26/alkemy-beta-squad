namespace DigitalArs.Api.DTOs;

public record TransferenciaResponseDto(
    decimal SaldoActual,
    string Mensaje = "Transferencia realizada con éxito.");