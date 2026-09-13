using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
namespace DigitalArs.Api.OpenApi;
internal sealed class BearerSecuritySchemeTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT" };
        foreach (var description in context.DescriptionGroups.SelectMany(g => g.Items))
        {
            if (description.ActionDescriptor.EndpointMetadata.OfType<IAllowAnonymous>().Any()) continue;
            var path = "/" + description.RelativePath?.Split('?')[0];
            if (document.Paths.TryGetValue(path, out var item) && item.Operations is not null)
                foreach (var operation in item.Operations.Where(o =>
                    o.Key.ToString().Equals(description.HttpMethod, StringComparison.OrdinalIgnoreCase)))
                    operation.Value.Security = [new OpenApiSecurityRequirement
                    { [new OpenApiSecuritySchemeReference("Bearer", document)] = [] }];
        }
        return Task.CompletedTask;
    }
}