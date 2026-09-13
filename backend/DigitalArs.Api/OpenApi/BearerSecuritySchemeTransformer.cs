using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace DigitalArs.Api.OpenApi;

// Swagger no sabe solo qué endpoints piden token: hay que marcárselos uno por uno para que
// muestre el candado y mande el header Authorization desde el botón Authorize.
internal sealed class BearerSecuritySchemeTransformer : IOpenApiDocumentTransformer
{
    private const string NombreDelEsquema = "Bearer";

    public Task TransformAsync(
        OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        DeclararEsquemaBearer(document);

        foreach (var endpoint in context.DescriptionGroups.SelectMany(grupo => grupo.Items))
        {
            if (EsPublico(endpoint)) continue;
            ExigirTokenEn(document, endpoint);
        }

        return Task.CompletedTask;
    }

    private static void DeclararEsquemaBearer(OpenApiDocument document)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes[NombreDelEsquema] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        };
    }

    private static bool EsPublico(ApiDescription endpoint) =>
        endpoint.ActionDescriptor.EndpointMetadata.OfType<IAllowAnonymous>().Any();

    private static void ExigirTokenEn(OpenApiDocument document, ApiDescription endpoint)
    {
        var ruta = "/" + endpoint.RelativePath?.Split('?')[0];
        if (!document.Paths.TryGetValue(ruta, out var item) || item.Operations is null) return;

        foreach (var operacion in item.Operations)
        {
            if (!operacion.Key.ToString().Equals(endpoint.HttpMethod, StringComparison.OrdinalIgnoreCase)) continue;

            operacion.Value.Security = [new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference(NombreDelEsquema, document)] = []
            }];
        }
    }
}
