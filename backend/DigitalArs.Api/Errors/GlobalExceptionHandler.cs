using Microsoft.AspNetCore.Diagnostics;

namespace DigitalArs.Api.Errors;

// Único lugar que atrapa excepciones no controladas, para que la respuesta siempre tenga
// la misma forma (ErrorResponse) que usan a mano el resto de los controllers.
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Excepción no controlada en {Path}", httpContext.Request.Path);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(new ErrorResponse
        {
            Code = "INTERNAL_ERROR",
            Message = "Ocurrió un error inesperado. Intentá nuevamente."
        }, cancellationToken);

        return true;
    }
}
