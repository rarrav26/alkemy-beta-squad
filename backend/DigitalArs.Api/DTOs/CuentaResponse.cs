namespace DigitalArs.Api.DTOs;

public record CuentaResponse(
    int Id,
    string Alias,
    string Cvu,
    decimal Saldo
);