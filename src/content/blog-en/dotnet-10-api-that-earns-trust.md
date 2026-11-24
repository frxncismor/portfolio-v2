---
title: "A .NET 10 API You Can Trust: Minimal APIs and Real Tests"
description: "How I structure a .NET 10 API coming from Node and Angular: Minimal APIs, built-in validation, ProblemDetails and integration tests on a real database."
date: 2026-11-22
category: "Backend"
cover: "api"
draft: false
---

# Building a .NET 10 API You Can Trust: Minimal APIs, Validation, ProblemDetails and Real Tests

**TL;DR:** In my current job I build an API with .NET 10, and I came in from years of Angular and Node. This is the shape I settled on: Minimal APIs grouped by feature, built-in validation, one consistent error format (`ProblemDetails`), typed configuration that fails at startup, and integration tests that hit a real PostgreSQL in a container. Every example below uses a made-up `orders`/`products` domain.

## Why I Stopped Missing Express

My background is frontend plus Node: Express, then Fastify. When I moved to .NET, I expected ceremony. Controllers, attributes everywhere, a folder per layer.

What I found with Minimal APIs is closer to Fastify than to old-school MVC: you register routes, you attach handlers, you compose with plugins (here, services and endpoint filters). The mental mapping is easy:

| Node world | .NET 10 |
|---|---|
| `app.register(plugin, { prefix })` | `app.MapGroup("/orders")` |
| JSON Schema / Zod on the route | built-in validation, FluentValidation |
| `setErrorHandler` | `IExceptionHandler` + `ProblemDetails` |
| `@fastify/swagger` | built-in OpenAPI (`AddOpenApi`) |
| `fastify.inject()` | `WebApplicationFactory` |

The big difference is the type system. A lot of what I validate by hand in TypeScript is simply expressed in the type here. That's the part I like most.

## Group Endpoints by Feature, Not by Layer

I don't keep a `Controllers/` folder and a `Services/` folder. Each feature owns its endpoints, its request/response records and its logic. `Program.cs` stays tiny:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOrders();      // feature registration
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddValidation();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapOrders();                   // feature endpoints

app.Run();

public partial class Program;      // lets tests reference the entry point
```

And each feature exposes one extension method that maps a group:

```csharp
public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrders(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orders")
            .WithTags("Orders");

        group.MapGet("/{id:guid}", GetOrder);
        group.MapPost("/", CreateOrder);

        return app;
    }

    private static async Task<Results<Ok<OrderResponse>, NotFound>> GetOrder(
        Guid id, IOrderService orders, CancellationToken ct)
    {
        var order = await orders.FindAsync(id, ct);
        return order is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(order);
    }

    private static async Task<Results<Created<OrderResponse>, ValidationProblem>> CreateOrder(
        CreateOrderRequest request, IOrderService orders, CancellationToken ct)
    {
        var created = await orders.CreateAsync(request, ct);
        return TypedResults.Created($"/orders/{created.Id}", created);
    }
}
```

Two things worth noticing. First, `MapGroup` is where shared behavior lives: prefix, tags, auth requirements, filters. Second, the handlers return `TypedResults` with a union in the signature. That `Results<Ok<...>, NotFound>` isn't decoration: the compiler knows every response the endpoint can produce, the OpenAPI document is generated from it, and a test can assert on the concrete type. In Express, the response shape lives in your head.

## Validation: Start With the Built-in One

.NET 10 added built-in validation for Minimal APIs. You call `AddValidation()` once, annotate your request types with the usual DataAnnotations attributes, and invalid requests are rejected before your handler runs, with a 400 `ValidationProblem` body.

```csharp
public sealed record CreateOrderRequest(
    [Required, MaxLength(64)] string CustomerRef,
    [MinLength(1)] IReadOnlyList<OrderLineRequest> Lines);

public sealed record OrderLineRequest(
    Guid ProductId,
    [Range(1, 1000)] int Quantity);
```

My rule of thumb for choosing:

- **Built-in validation** when rules are shape-level: required, length, range, format. It's zero extra dependencies and it covers most request DTOs.
- **FluentValidation** when rules are conditional, cross-field, or need injected services (for example, "this product must exist and be active"). The rules read like code, and they are easy to unit test.

Don't make it either/or by religion. I use the built-in one at the edge for cheap structural checks, and I keep business rules in the domain layer, where they throw or return a result. Validation attributes tell the client *what shape you sent is wrong*. Business rules tell the client *what you asked is not allowed*. Those are different failures.

## One Error Format: ProblemDetails

The worst APIs I've integrated with return a different error shape per endpoint. RFC 9457 (`application/problem+json`) fixes that, and .NET supports it natively. `AddProblemDetails()` plus an `IExceptionHandler` gives you a single place that turns exceptions into consistent responses:

```csharp
public sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetails,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, title) = exception switch
        {
            DomainConflictException => (StatusCodes.Status409Conflict, "Conflict"),
            _ => (StatusCodes.Status500InternalServerError, "Unexpected error")
        };

        if (status >= 500)
        {
            logger.LogError(exception, "Unhandled exception");
        }

        context.Response.StatusCode = status;

        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails { Status = status, Title = title }
        });
    }
}
```

Notice what is *not* in the response: the exception message and the stack trace. A 500 gets a generic title; the details go to the logs. Leaking internals through error bodies is an easy mistake, and a single handler makes it easy to prevent. The client always receives the same envelope, and your frontend can write one error-handling path instead of five.

## Typed Options That Fail Fast

In Node I've lost count of how many times a missing environment variable only blew up when the code path ran in production. .NET has a good answer: bind configuration to a typed class, validate it, and validate **on start**.

```csharp
public sealed class StorageOptions
{
    public const string Section = "Storage";

    [Required] public string ConnectionString { get; init; } = "";
    [Range(1, 100)] public int MaxPoolSize { get; init; } = 20;
}

builder.Services
    .AddOptions<StorageOptions>()
    .BindConfiguration(StorageOptions.Section)
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

If the configuration is wrong, the app refuses to boot, the deploy fails, and you find out in seconds rather than at 3 a.m. That's the difference between configuration as a bag of strings and configuration as a contract. Secrets stay out of the repo and come from environment variables or a secret store; the options class only describes what the app needs.

## Tests: Unit Tests for Logic, Integration Tests for Truth

I split tests by what they can prove.

**Unit tests (xUnit)** cover pure logic: price calculations, state transitions, mapping. They're fast and I write plenty of them.

**Integration tests** cover everything a unit test can't see: routing, model binding, validation, serialization, the exception handler, and the actual SQL. For these I use `WebApplicationFactory<Program>` and a real PostgreSQL started by Testcontainers, instead of an in-memory fake. An in-memory provider doesn't enforce the same constraints or behave like your real engine, so tests pass and production fails. A real database in a container costs a few seconds of startup and removes that whole class of lies.

```csharp
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder()
        .WithImage("postgres:17")
        .Build();

    public async Task InitializeAsync() => await _db.StartAsync();

    public new async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Storage:ConnectionString", _db.GetConnectionString());
    }
}
```

(Depending on your xUnit version, the `IAsyncLifetime` signatures use `Task` or `ValueTask`; follow the one your analyzer asks for.)

Then the tests read like a client talking to the API:

```csharp
public sealed class OrderEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Post_with_no_lines_returns_validation_problem()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/orders",
            new { customerRef = "c-1", lines = Array.Empty<object>() });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.Contains("Lines", problem!.Errors.Keys);
    }
}
```

That single test exercises routing, JSON binding, the validation pipeline and the error format. It is the closest thing to `fastify.inject()` I've found, and it's the test I trust most. Keep each test's data isolated (unique keys, or reset between tests) so they can run in any order.

## A Note on Doing This With AI in the Loop

I use AI assistants heavily when writing this kind of code, and the structure above is exactly what makes that safe. Typed results, a single error format and integration tests give the generated code something strict to be checked against. I'll write about that workflow separately; the short version is that the tests decide, not the model.

## The Checklist I Use

- Endpoints grouped by feature with `MapGroup`; `Program.cs` only wires things up
- Handlers return `TypedResults` with an explicit result union
- Request DTOs are records, validated before the handler runs
- Business rules live outside the HTTP layer and are unit tested
- All errors leave as `ProblemDetails`; 500s never expose messages or stack traces
- Options are typed, validated and `ValidateOnStart`
- OpenAPI document generated from the code, not written by hand
- Integration tests run against the real database engine in a container
- At least one test per endpoint for the happy path and the main failure
- Secrets come from the environment or a secret store, never the repo

## Key Takeaways

- Minimal APIs feel familiar if you know Fastify: groups are plugins, `TypedResults` are your response contract.
- Use built-in validation for shape, and keep business rules in the domain.
- One `ProblemDetails` envelope makes the API predictable for every client.
- `ValidateOnStart` turns configuration mistakes into deploy-time failures.
- Test with a real database. It is slower than a fake by seconds and more honest by a mile.

## Further Reading

- [Minimal APIs overview (Microsoft Learn)](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis/overview)
- [Handle errors in ASP.NET Core APIs](https://learn.microsoft.com/aspnet/core/fundamentals/error-handling-api)
- [Integration tests in ASP.NET Core](https://learn.microsoft.com/aspnet/core/test/integration-tests)
- [Options pattern in ASP.NET Core](https://learn.microsoft.com/aspnet/core/fundamentals/configuration/options)
- [Testcontainers for .NET](https://dotnet.testcontainers.org/)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
