---
title: "C# para desarrolladores TypeScript: guía de traducción"
description: "Un mapa práctico de TypeScript a C# 14 y .NET 10: tipos, records, nullable reference types, LINQ, Task e inyección de dependencias, con sus trampas."
date: 2027-01-25
category: "Backend"
draft: false
---

# C# para desarrolladores TypeScript: guía práctica de traducción

**TL;DR:** Si escribes TypeScript, ya conoces la mayoría de las ideas de C#. La sintaxis es la parte fácil. Lo que muerde son las diferencias semánticas: los tipos de C# son nominales y existen en runtime, la nulabilidad es una función del compilador que hay que activar y respetar, LINQ es perezoso, y un `Task` no es exactamente una `Promise`. Este es el mapa que yo hubiera querido al pasar de Angular y Node a .NET 10 (C# 14). Los ejemplos usan un dominio inventado de `orders`. Para el lado de la API, mira [mi post de una API en .NET 10](/es/blog/dotnet-10-api-that-earns-trust/) y [cómo llegué a full stack](/es/blog/from-frontend-to-full-stack/).

## Tipos: nominales y reales en runtime

En TypeScript los tipos son estructurales y se borran. Dos interfaces sin relación pero con la misma forma son intercambiables, y en runtime no queda nada de ellas.

```ts
interface Money { amount: number; currency: string }
interface Price { amount: number; currency: string }

const p: Price = { amount: 10, currency: 'EUR' };
const m: Money = p; // fine: same shape
```

En C# un tipo es su nombre. `Money` y `Price` son tipos distintos aunque tengan miembros idénticos, y el tipo existe en runtime (lo puedes revisar con `is`, y la reflexión lo ve).

```csharp
public sealed record Money(decimal Amount, string Currency);
public sealed record Price(decimal Amount, string Currency);

Price p = new(10m, "EUR");
Money m = p; // compile error: no conversion
```

Dos cosas más que cambian cómo piensas:

- No hay tipos de objeto en línea ni uniones de literales. Modelas "una de varias formas" con una jerarquía de herencia, y la estrechas con pattern matching (expresiones `switch` e `is`).
- Un número no es `number`. Eliges `int`, `long`, `double` o `decimal`. Usa `decimal` para dinero, por la misma razón por la que evitas los floats para dinero en JavaScript.

## Records: tu tipo de datos por defecto

Lo más parecido a un objeto literal con nombre de TypeScript es un `record`. Un record posicional declara en una línea un constructor, propiedades init-only, igualdad por valor, `ToString` y una expresión `with`.

```csharp
public sealed record OrderLine(Guid ProductId, int Quantity);

public sealed record Order(Guid Id, string CustomerRef, IReadOnlyList<OrderLine> Lines);

var order = new Order(Guid.NewGuid(), "c-1", [new(Guid.NewGuid(), 2)]);

// non-destructive update, like { ...order, customerRef: 'c-2' }
var renamed = order with { CustomerRef = "c-2" };
```

Ese `with` es la copia con spread que ya usas en los reducers. Dos trampas que menciona la documentación:

- Dos records son iguales cuando sus miembros son iguales (un `record class` sigue siendo un tipo por referencia, pero `==` compara valores). Los arrays dentro de un record se comparan **por referencia**, así que dos records con dos arrays distintos de igual contenido no son iguales. Usa `IReadOnlyList<T>` y compara con intención, o acepta que es superficial.
- La inmutabilidad es superficial. Las propiedades son init-only, pero si una contiene un array o lista mutable, ese contenido todavía puede cambiar. Es la misma historia que `readonly` en TypeScript.

Cuándo usar mejor una `class`: cosas con identidad y comportamiento, como una entidad de EF Core. La documentación dice que los records no son apropiados como tipos de entidad en EF Core, porque EF depende de la igualdad por referencia. DTOs, requests, responses y value objects son records.

## Nulabilidad: strictNullChecks, pero solo si lo activas

C# tiene nullable reference types, y el modelo te resultará familiar: la propia página de Learn lo compara con el `strictNullChecks` de TypeScript. En un proyecto nuevo la plantilla lo activa:

```xml
<Nullable>enable</Nullable>
```

Con eso, `string` significa "nunca null" y `string?` significa "quizá null".

```csharp
string required = "always set";
string? optional = null;

Console.WriteLine(required.Length);

if (optional is not null)
{
    Console.WriteLine(optional.Length); // narrowed, like a TS type guard
}
```

Diferencias con TypeScript que vale la pena conocer:

- Es **solo una función de compilación**. En runtime `string` y `string?` son el mismo tipo, y el compilador produce advertencias, no errores, a menos que los configures como errores. En el build de CI trato las advertencias de nullable como errores.
- `!` es la misma válvula de escape que en TypeScript (el operador null-forgiving): `maybeName!.Length`. La documentación dice que se use con moderación, y estoy de acuerdo. Cada uno es un lugar donde el compilador deja de protegerte.
- El `null` todavía se puede colar. Un struct `default` con campos de tipo referencia, o `new string[3]`, contiene nulls sin advertencia. La deserialización de JSON y todo lo que cruza una frontera también puede darte un null donde el tipo dice que no hay, así que valida la entrada en el borde.
- `?.` y `??` funcionan como esperas. C# 14 agrega **asignación** condicional a null, así que `customer?.Order = GetCurrentOrder();` solo asigna cuando `customer` no es null.

## LINQ: map, filter, reduce, pero perezoso

LINQ son tus métodos de array sobre cualquier `IEnumerable<T>`, con otros nombres.

| TypeScript | C# (LINQ) |
|---|---|
| `map` | `Select` |
| `filter` | `Where` |
| `reduce` | `Aggregate` (o `Sum`, `Max`, ...) |
| `find` | `FirstOrDefault` |
| `some` / `every` | `Any` / `All` |
| `flatMap` | `SelectMany` |
| `sort` (muta) | `OrderBy` (devuelve una secuencia nueva) |

```csharp
using System.Linq;

IEnumerable<OrderLine> lines = order.Lines;

var total = lines
    .Where(l => l.Quantity > 0)
    .Sum(l => l.Quantity);

var ids = lines.Select(l => l.ProductId).ToList();
```

La gran diferencia: **las consultas LINQ son diferidas**. `Where` y `Select` no se ejecutan cuando las llamas. Describen una consulta que corre cuando la enumeras (con `foreach`, o `ToList`, `ToArray`, `Count`...). La documentación lo dice claro: los resultados dependen del contenido de la fuente cuando se ejecuta la consulta, no cuando se define, y enumerarla dos veces puede dar resultados distintos y repetir el trabajo.

```csharp
List<int> numbers = [1, 2, 3];

var evens = numbers.Where(n => n % 2 == 0); // nothing has run yet
numbers.Add(4);                             // changes the result
var materialized = evens.ToList();          // runs now: [2, 4]
```

Así que `ToList()` es la forma de decir "evalúa esto ahora y guarda el resultado", que es lo que `map` y `filter` siempre hicieron en JavaScript. Con EF Core la misma regla significa que la consulta se envía a la base de datos cuando la enumeras, una fuente común de bugs de "por qué esto corrió dos veces".

## Task y async: una Promise con otras reglas

`async`/`await` se ven igual, y eso es lo bueno y lo peligroso.

| TypeScript | C# |
|---|---|
| `Promise<T>` | `Task<T>` |
| `Promise<void>` | `Task` |
| `Promise.all` | `Task.WhenAll` |
| `AbortSignal` | `CancellationToken` |
| `async function f()` | `async Task<T> FAsync()` (el nombre termina en `Async`) |

```csharp
public async Task<Order?> FindOrderAsync(IOrderRepository orders, Guid id, CancellationToken ct)
{
    var order = await orders.FindAsync(id, ct);
    return order;
}

// like Promise.all: start both, wait for both
Order?[] results = await Task.WhenAll(
    FindOrderAsync(orders, idA, ct),
    FindOrderAsync(orders, idB, ct));
```

Lo que hay que tener presente:

- Un `Task` ya está corriendo cuando lo recibes, igual que una promesa. En el ejemplo de Learn, se llama a `GetStringAsync`, se hace otro trabajo y solo después se espera la tarea.
- `await` no bloquea el hilo. La documentación es explícita en que `async` y `await` no crean hilos adicionales. Bloquear una tarea con `.Result` o `.Wait()` sí bloquea el hilo que llama hasta que termina, así que en una API web no los mezcles con `await`. Async de arriba abajo.
- Pasa un `CancellationToken` por toda la cadena de llamadas. En una Minimal API de ASP.NET Core un handler puede declararlo como parámetro y queda ligado a que la petición se aborte. Es el `AbortSignal` que probablemente nunca conectaste en Node.
- Un método `async void` no se puede esperar y quien lo llama no puede capturar sus excepciones. Usa `async Task`, salvo en event handlers.
- Nombra los métodos async con el sufijo `Async`. El compilador no lo exige, pero todos lo esperan.

## Módulos e inyección: imports vs el contenedor

TypeScript conecta dependencias con `import`. En .NET, un `using` solo trae **nombres** al ámbito (se parece más a un import de namespace que a un sistema de módulos). Las dependencias entre tus propias clases las conecta el contenedor de inyección de dependencias, que a quien viene de Angular le resulta conocido.

```csharp
public interface IOrderService
{
    Task<Order?> FindAsync(Guid id, CancellationToken ct);
}

public sealed class OrderService(IOrderRepository repository) : IOrderService
{
    public Task<Order?> FindAsync(Guid id, CancellationToken ct) =>
        repository.FindAsync(id, ct);
}

// Program.cs
builder.Services.AddScoped<IOrderService, OrderService>();
```

`OrderService(IOrderRepository repository)` es un primary constructor, y el contenedor entrega el argumento. Se corresponde directo con el `inject()` de Angular: pides un tipo y el framework te da la instancia registrada. Lo que hay que aprender son los tiempos de vida: `AddSingleton` (uno para toda la app), `AddScoped` (uno por request) y `AddTransient` (uno nuevo cada vez). Scoped es la opción por defecto para todo lo que toque un contexto de base de datos.

## Algunas comodidades de C# 14

C# 14 viene con .NET 10. Dos funciones que notarás viniendo de TypeScript:

```csharp
public string Email
{
    get;
    set => field = value?.Trim().ToLowerInvariant() ?? string.Empty;
}
```

La palabra clave `field` es un campo de respaldo generado por el compilador, así que una propiedad con un poco de lógica ya no necesita una variable privada. Y los extension members extienden la idea de los métodos de extensión a las propiedades:

```csharp
public static class OrderExtensions
{
    extension(Order order)
    {
        public int TotalQuantity => order.Lines.Sum(l => l.Quantity);
    }
}
```

Después, `order.TotalQuantity` se lee como una propiedad de `Order`. En TypeScript usarías una función suelta; aquí vive junto al tipo.

## Las trampas en las que caí

- **`struct` vs `class`.** Un `struct` se copia al asignarlo, como un primitivo. Usa `class`/`record` por defecto; recurre a `struct` solo para valores pequeños e inmutables.
- **`string` es inmutable**, como en JavaScript, y se compara por valor con `==`. `Guid`, `DateTime` y `decimal` son structs que también se comparan por valor.
- **`==` en records es igualdad por valor**, pero en una `class` normal es igualdad por referencia, a menos que la clase lo sobrescriba.
- **Las advertencias de nullable son advertencias.** Un build en verde con 200 de ellas no está en verde.
- **Async de arriba abajo.** Un solo `.Result` en medio de la ruta de una petición basta para causar problemas bajo carga.

## Puntos Clave

- Los tipos son nominales y existen en runtime; usa records para datos y classes para identidad y comportamiento.
- Activa los nullable reference types, trata las advertencias como errores y valida en las fronteras.
- LINQ es perezoso. `ToList()` es el botón de "ejecútalo ya".
- `Task` es una promesa con cancelación integrada; nunca la bloquees.
- Las dependencias salen del contenedor de DI, y los tiempos de vida (`Singleton`, `Scoped`, `Transient`) son el concepto que hay que aprender primero.

## Lecturas Recomendadas

- [Nullable reference types (Microsoft Learn)](https://learn.microsoft.com/dotnet/csharp/fundamentals/null-safety/nullable-reference-types)
- [Records (C# reference)](https://learn.microsoft.com/dotnet/csharp/language-reference/builtin-types/record)
- [Introduction to LINQ queries](https://learn.microsoft.com/dotnet/csharp/linq/get-started/introduction-to-linq-queries)
- [Task asynchronous programming model](https://learn.microsoft.com/dotnet/csharp/asynchronous-programming/task-asynchronous-programming-model)
- [What's new in C# 14](https://learn.microsoft.com/dotnet/csharp/whats-new/csharp-14)
