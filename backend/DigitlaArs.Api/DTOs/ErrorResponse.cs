using System.Text.Json.Serialization;

namespace DigitalArs.Api.DTOs;

// Los campos nulos no se serializan a proposito: asi el JSON sigue siendo identico al que
// devolvian los objetos anonimos. Un error sin codigo no incluye la clave "code", en vez de
// mandar "code": null y cambiarle el contrato al frontend.
public record ErrorResponse
{
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Code { get; init; }

    public required string Message { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string[]? Errors { get; init; }
}
