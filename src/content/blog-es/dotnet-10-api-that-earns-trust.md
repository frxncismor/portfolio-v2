---
title: "Una API en .NET 10 de Confianza: Minimal APIs y Pruebas"
description: "Cómo estructuro una API en .NET 10 viniendo de Node y Angular: Minimal APIs, validación integrada, ProblemDetails y pruebas con una base de datos real."
date: 2026-11-22
category: "Backend"
draft: false
---

# Cómo Construir una API en .NET 10 en la que Puedas Confiar: Minimal APIs, Validación, ProblemDetails y Pruebas Reales

**TL;DR:** En mi trabajo actual construyo una API con .NET 10, y llegué desde años de Angular y Node. Esta es la forma que me funcionó: Minimal APIs agrupadas por feature, validación integrada, un solo formato de errores (`ProblemDetails`), configuración tipada que falla al arrancar y pruebas de integración contra un PostgreSQL real en un contenedor. Todos los ejemplos usan un dominio inventado de `orders`/`products`.

## Por Qué Dejé de Extrañar Express

Vengo del frontend y de Node: Express, luego Fastify. Cuando pasé a .NET esperaba ceremonia. Controladores, atributos por todos lados, una carpeta por capa.

Lo que encontré con las Minimal APIs se parece más a Fastify que al MVC de antes: registras rutas, les asignas handlers y compones con servicios y filtros de endpoint. El mapeo mental es sencillo:

| Mundo Node | .NET 10 |
|---|---|
| `app.register(plugin, { prefix })` | `app.MapGroup("/orders")` |
| JSON Schema / Zod en la ruta | validación integrada, FluentValidation |
| `setErrorHandler` | `IExceptionHandler` + `ProblemDetails` |
| `@fastify/swagger` | OpenAPI integrado (`AddOpenApi`) |
| `fastify.inject()` | `WebApplicationFactory` |

La gran diferencia es el sistema de tipos. Mucho de lo que en TypeScript valido a mano aquí se expresa en el propio tipo. Es lo que más me gusta.

## Agrupa los Endpoints por Feature, No por Capa

No tengo una carpeta `Controllers/` y otra `Services/`. Cada feature es dueña de sus endpoints, sus records de request/response y su lógica. `Program.cs` se queda chiquito:

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

Y cada feature expone un método de extensión que mapea un grupo:

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

Dos cosas que vale la pena notar. Primero, `MapGroup` es donde vive el comportamiento compartido: prefijo, tags, requisitos de autenticación, filtros. Segundo, los handlers regresan `TypedResults` con una unión en la firma. Ese `Results<Ok<...>, NotFound>` no es decoración: el compilador sabe todas las respuestas que el endpoint puede producir, el documento OpenAPI se genera a partir de ahí y una prueba puede afirmar sobre el tipo concreto. En Express, la forma de la respuesta vive en tu cabeza.

## Validación: Empieza con la Integrada

.NET 10 agregó validación integrada para Minimal APIs. Llamas a `AddValidation()` una vez, anotas tus tipos de request con los atributos de DataAnnotations de siempre, y las peticiones inválidas se rechazan antes de que corra tu handler, con un cuerpo 400 `ValidationProblem`.

```csharp
public sealed record CreateOrderRequest(
    [Required, MaxLength(64)] string CustomerRef,
    [MinLength(1)] IReadOnlyList<OrderLineRequest> Lines);

public sealed record OrderLineRequest(
    Guid ProductId,
    [Range(1, 1000)] int Quantity);
```

Mi regla para elegir:

- **Validación integrada** cuando las reglas son de forma: requerido, longitud, rango, formato. No agrega dependencias y cubre la mayoría de los DTOs de entrada.
- **FluentValidation** cuando las reglas son condicionales, entre campos, o necesitan servicios inyectados (por ejemplo, "este producto debe existir y estar activo"). Las reglas se leen como código y es fácil probarlas con unit tests.

No lo conviertas en religión. Uso la integrada en el borde para chequeos estructurales baratos, y dejo las reglas de negocio en la capa de dominio, donde lanzan una excepción o regresan un resultado. Los atributos de validación le dicen al cliente *que la forma que mandó está mal*. Las reglas de negocio le dicen *que lo que pidió no está permitido*. Son fallas distintas.

## Un Solo Formato de Error: ProblemDetails

Las peores APIs que me ha tocado integrar regresan una forma de error distinta por endpoint. El RFC 9457 (`application/problem+json`) arregla eso y .NET lo soporta de forma nativa. `AddProblemDetails()` más un `IExceptionHandler` te da un solo lugar que convierte excepciones en respuestas consistentes:

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

Fíjate en lo que *no* va en la respuesta: el mensaje de la excepción ni el stack trace. Un 500 recibe un título genérico; los detalles van a los logs. Filtrar internos por el cuerpo del error es un descuido fácil, y un handler único hace fácil evitarlo. El cliente siempre recibe el mismo envelope y tu frontend puede escribir un solo camino de manejo de errores en vez de cinco.

## Opciones Tipadas que Fallan Rápido

En Node he perdido la cuenta de las veces que una variable de entorno faltante solo explotó cuando el código corrió en producción. .NET tiene una buena respuesta: enlaza la configuración a una clase tipada, valídala y valídala **al arrancar**.

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

Si la configuración está mal, la app se niega a arrancar, el deploy falla y te enteras en segundos y no a las 3 a.m. Esa es la diferencia entre configuración como una bolsa de strings y configuración como un contrato. Los secretos se quedan fuera del repo y vienen de variables de entorno o de un secret store; la clase de opciones solo describe lo que la app necesita.

## Pruebas: Unitarias para la Lógica, de Integración para la Verdad

Separo las pruebas por lo que pueden demostrar.

**Pruebas unitarias (xUnit)** cubren lógica pura: cálculos de precio, transiciones de estado, mapeos. Son rápidas y escribo muchas.

**Pruebas de integración** cubren todo lo que una unitaria no ve: ruteo, model binding, validación, serialización, el exception handler y el SQL real. Para estas uso `WebApplicationFactory<Program>` y un PostgreSQL real levantado con Testcontainers, en vez de un fake en memoria. Un proveedor en memoria no aplica las mismas restricciones ni se comporta como tu motor real, así que las pruebas pasan y producción falla. Una base de datos real en un contenedor cuesta unos segundos de arranque y elimina toda esa clase de mentiras.

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

(Según tu versión de xUnit, las firmas de `IAsyncLifetime` usan `Task` o `ValueTask`; sigue la que te pida el analizador.)

Luego las pruebas se leen como un cliente hablando con la API:

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

Esa sola prueba ejercita el ruteo, el binding de JSON, el pipeline de validación y el formato de error. Es lo más cercano a `fastify.inject()` que he encontrado, y es la prueba en la que más confío. Mantén los datos de cada prueba aislados (llaves únicas, o un reset entre pruebas) para que puedan correr en cualquier orden.

## Una Nota sobre Hacer Esto con IA en el Loop

Uso asistentes de IA a fondo al escribir este tipo de código, y la estructura de arriba es justo lo que lo hace seguro. Los resultados tipados, un solo formato de error y las pruebas de integración le dan al código generado algo estricto contra qué compararse. Escribiré de ese flujo por separado; la versión corta es que las pruebas deciden, no el modelo.

## El Checklist que Uso

- Endpoints agrupados por feature con `MapGroup`; `Program.cs` solo conecta piezas
- Los handlers regresan `TypedResults` con una unión de resultados explícita
- Los DTOs de entrada son records y se validan antes del handler
- Las reglas de negocio viven fuera de la capa HTTP y tienen pruebas unitarias
- Todos los errores salen como `ProblemDetails`; los 500 nunca exponen mensajes ni stack traces
- Las opciones son tipadas, validadas y con `ValidateOnStart`
- El documento OpenAPI se genera desde el código, no a mano
- Las pruebas de integración corren contra el motor de base de datos real en un contenedor
- Al menos una prueba por endpoint para el caso feliz y la falla principal
- Los secretos vienen del entorno o de un secret store, nunca del repo

## Puntos Clave

- Las Minimal APIs se sienten familiares si conoces Fastify: los grupos son plugins y `TypedResults` es tu contrato de respuesta.
- Usa la validación integrada para la forma y deja las reglas de negocio en el dominio.
- Un solo envelope de `ProblemDetails` hace la API predecible para cualquier cliente.
- `ValidateOnStart` convierte los errores de configuración en fallas al desplegar.
- Prueba con una base de datos real. Es segundos más lenta que un fake y mucho más honesta.

## Lecturas Recomendadas

- [Minimal APIs overview (Microsoft Learn)](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis/overview)
- [Handle errors in ASP.NET Core APIs](https://learn.microsoft.com/aspnet/core/fundamentals/error-handling-api)
- [Integration tests in ASP.NET Core](https://learn.microsoft.com/aspnet/core/test/integration-tests)
- [Options pattern in ASP.NET Core](https://learn.microsoft.com/aspnet/core/fundamentals/configuration/options)
- [Testcontainers for .NET](https://dotnet.testcontainers.org/)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
