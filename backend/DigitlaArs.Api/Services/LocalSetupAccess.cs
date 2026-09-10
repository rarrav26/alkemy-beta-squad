using System.Net;

namespace DigitalArs.Api.Services;

public static class LocalSetupAccess
{
    public static bool IsAllowed(HttpContext context, IHostEnvironment environment, IConfiguration configuration)
    {
        if (!environment.IsDevelopment() || context.Connection.RemoteIpAddress is not { } address ||
            !IPAddress.IsLoopback(address.IsIPv4MappedToIPv6 ? address.MapToIPv4() : address) ||
            !IsLoopbackHost(context.Request.Host.Host)) return false;
        // Do not mistake a request relayed by a proxy for a local browser.
        if (context.Request.Headers.ContainsKey("Forwarded") ||
            context.Request.Headers.Keys.Any(k => k.StartsWith("X-Forwarded-", StringComparison.OrdinalIgnoreCase)))
            return false;
        var origin = context.Request.Headers.Origin.ToString();
        if (origin.Length == 0) return true;
        var allowed = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
        return Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
            IsLoopbackHost(uri.Host) && allowed.Contains(origin, StringComparer.OrdinalIgnoreCase);
    }

    private static bool IsLoopbackHost(string host) => host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
        (IPAddress.TryParse(host.Trim('[', ']'), out var ip) && IPAddress.IsLoopback(ip));
}
