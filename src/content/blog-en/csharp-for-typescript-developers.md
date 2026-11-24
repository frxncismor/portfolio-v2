---
title: "C# for TypeScript Developers: A Translation Guide"
description: "A practical map from TypeScript to C# 14 and .NET 10: types, records, nullable reference types, LINQ, Task and dependency injection, plus the traps."
date: 2027-01-25
category: "Backend"
cover: "columns"
draft: false
---

# C# for TypeScript Developers: A Practical Translation Guide

**TL;DR:** If you write TypeScript, you already know most of C#'s ideas. The syntax is the easy part. The differences that bite are semantic: C# types are nominal and exist at runtime, nullability is a compiler feature you have to turn on and respect, LINQ is lazy, and a `Task` is not quite a `Promise`. This is the map I wish I had when I moved from Angular and Node to .NET 10 (C# 14). Examples use an invented `orders` domain. For the API side of the move, see [my .NET 10 API post](/blog/dotnet-10-api-that-earns-trust/) and [how I got to full stack](/blog/from-frontend-to-full-stack/).

## Types: Nominal, and Real at Runtime

In TypeScript, types are structural and erased. Two unrelated interfaces with the same shape are interchangeable, and at runtime nothing is left of them.

```ts
interface Money { amount: number; currency: string }
interface Price { amount: number; currency: string }

const p: Price = { amount: 10, currency: 'EUR' };
const m: Money = p; // fine: same shape
```

In C# a type is its name. `Money` and `Price` are different types even with identical members, and the type exists at runtime (you can check it with `is`, and reflection can see it).

```csharp
public sealed record Money(decimal Amount, string Currency);
public sealed record Price(decimal Amount, string Currency);

Price p = new(10m, "EUR");
Money m = p; // compile error: no conversion
```

Two more things that change how you think:

- There are no inline object types and no unions of literals. You model "one of several shapes" with an inheritance hierarchy, and you narrow with pattern matching (`switch` expressions and `is`).
- A number is not `number`. You pick `int`, `long`, `double` or `decimal`. Use `decimal` for money, for the same reason you avoid floats for money in JavaScript.

## Records: Your Default Data Type

The closest thing to a TypeScript object literal with a name is a `record`. A positional record declares a constructor, init-only properties, value equality, `ToString` and a `with` expression in one line.

```csharp
public sealed record OrderLine(Guid ProductId, int Quantity);

public sealed record Order(Guid Id, string CustomerRef, IReadOnlyList<OrderLine> Lines);

var order = new Order(Guid.NewGuid(), "c-1", [new(Guid.NewGuid(), 2)]);

// non-destructive update, like { ...order, customerRef: 'c-2' }
var renamed = order with { CustomerRef = "c-2" };
```

That `with` is the spread-copy you already use in reducers. Two traps from the docs:

- Two records are equal when their members are equal (a `record class` is still a reference type, but `==` compares values). Arrays inside a record are compared **by reference**, so two records holding two different arrays with the same contents are not equal. Use `IReadOnlyList<T>` and compare deliberately, or accept that this is shallow.
- Immutability is shallow. The properties are init-only, but if one holds a mutable array or list, that content can still change. It is the same story as `readonly` in TypeScript.

When to use a `class` instead: things with identity and behavior, such as an EF Core entity. The docs say records are not appropriate as EF Core entity types, because EF relies on reference equality. DTOs, requests, responses and value objects are records.

## Nullability: strictNullChecks, but Only if You Turn It On

C# has nullable reference types, and the model will be familiar: the Learn page itself compares it to TypeScript's `strictNullChecks`. In a new project the template enables it:

```xml
<Nullable>enable</Nullable>
```

With it on, `string` means "never null" and `string?` means "maybe null".

```csharp
string required = "always set";
string? optional = null;

Console.WriteLine(required.Length);

if (optional is not null)
{
    Console.WriteLine(optional.Length); // narrowed, like a TS type guard
}
```

Differences from TypeScript worth knowing:

- It is a **compile-time feature only**. At runtime `string` and `string?` are the same type, and the compiler produces warnings, not errors, unless you configure them as errors. In a CI build I treat nullable warnings as errors.
- `!` is the same escape hatch as in TypeScript (the null-forgiving operator): `maybeName!.Length`. The docs say to use it sparingly, and I agree. Each one is a place the compiler stops protecting you.
- `null` can still sneak in. A `default` struct with reference-typed fields, or `new string[3]`, contains nulls without a warning. JSON deserialization and anything that crosses a boundary can also give you a null where the type says there is none, so validate input at the edge.
- `?.` and `??` work as you expect. C# 14 adds null-conditional **assignment**, so `customer?.Order = GetCurrentOrder();` assigns only when `customer` is not null.

## LINQ: map, filter, reduce, but Lazy

LINQ is your array methods on any `IEnumerable<T>`, with different names.

| TypeScript | C# (LINQ) |
|---|---|
| `map` | `Select` |
| `filter` | `Where` |
| `reduce` | `Aggregate` (or `Sum`, `Max`, ...) |
| `find` | `FirstOrDefault` |
| `some` / `every` | `Any` / `All` |
| `flatMap` | `SelectMany` |
| `sort` (mutates) | `OrderBy` (returns a new sequence) |

```csharp
using System.Linq;

IEnumerable<OrderLine> lines = order.Lines;

var total = lines
    .Where(l => l.Quantity > 0)
    .Sum(l => l.Quantity);

var ids = lines.Select(l => l.ProductId).ToList();
```

The big difference: **LINQ queries are deferred**. `Where` and `Select` do not run when you call them. They describe a query that runs when you enumerate it (with `foreach`, or `ToList`, `ToArray`, `Count`...). The docs spell it out: the results depend on the contents of the source when the query executes, not when it is defined, and enumerating twice can give different results and run the work twice.

```csharp
List<int> numbers = [1, 2, 3];

var evens = numbers.Where(n => n % 2 == 0); // nothing has run yet
numbers.Add(4);                             // changes the result
var materialized = evens.ToList();          // runs now: [2, 4]
```

So `ToList()` is how you say "evaluate this now and keep the result", which is what `map` and `filter` always did in JavaScript. With EF Core the same rule means a query is sent to the database when you enumerate it, which is a common source of "why did this run twice" bugs.

## Task and async: Promise With Different Rules

`async`/`await` look the same, and that is both the good and the dangerous part.

| TypeScript | C# |
|---|---|
| `Promise<T>` | `Task<T>` |
| `Promise<void>` | `Task` |
| `Promise.all` | `Task.WhenAll` |
| `AbortSignal` | `CancellationToken` |
| `async function f()` | `async Task<T> FAsync()` (name ends in `Async`) |

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

What to keep in mind:

- A `Task` is already running when you get it, like a promise. In the Learn example, `GetStringAsync` is called, other work happens, and only then is the task awaited.
- `await` does not block the thread. The docs are explicit that `async` and `await` do not create extra threads. Blocking on a task with `.Result` or `.Wait()` does block the calling thread until it finishes, so in a web API do not mix them with `await`. Go async all the way up.
- Pass a `CancellationToken` down the call chain. In an ASP.NET Core Minimal API a handler can declare one as a parameter and it is tied to the request being aborted. That is the `AbortSignal` you probably never wired up in Node.
- An `async void` method cannot be awaited and its caller cannot catch its exceptions. Use `async Task`, except for event handlers.
- Name async methods with the `Async` suffix. The compiler does not require it, but everyone expects it.

## Modules and Injection: imports vs the Container

TypeScript wires dependencies with `import`. In .NET, a `using` only brings **names** into scope (it is closer to a namespace import than to a module system). Dependencies between your own classes are wired by the dependency injection container, which Angular developers already understand.

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

`OrderService(IOrderRepository repository)` is a primary constructor, and the container supplies the argument. It maps directly to Angular's `inject()`: you ask for a type and the framework gives you the registered instance. The lifetimes are the part to learn: `AddSingleton` (one for the app), `AddScoped` (one per request) and `AddTransient` (new every time). Scoped is the default choice for anything touching a database context.

## A Few C# 14 Conveniences

C# 14 ships with .NET 10. Two features you will notice coming from TypeScript:

```csharp
public string Email
{
    get;
    set => field = value?.Trim().ToLowerInvariant() ?? string.Empty;
}
```

The `field` keyword is a compiler-generated backing field, so a property with a small piece of logic no longer needs a private variable. And extension members extend the idea of extension methods to properties:

```csharp
public static class OrderExtensions
{
    extension(Order order)
    {
        public int TotalQuantity => order.Lines.Sum(l => l.Quantity);
    }
}
```

After that, `order.TotalQuantity` reads like a property of `Order`. In TypeScript you would reach for a standalone function; here it lives with the type.

## The Traps I Hit

- **`struct` vs `class`.** A `struct` is copied on assignment, like a primitive. Default to `class`/`record`; reach for `struct` only for small immutable values.
- **`string` is immutable**, as in JavaScript, and it compares by value with `==`. `Guid`, `DateTime` and `decimal` are structs that also compare by value.
- **`==` on records is value equality**, but on a plain `class` it is reference equality unless the class overrides it.
- **Nullable warnings are warnings.** A green build with 200 of them is not green.
- **Async all the way.** One `.Result` in the middle of a request path is enough to cause problems under load.

## Key Takeaways

- Types are nominal and exist at runtime; use records for data, classes for identity and behavior.
- Turn nullable reference types on, treat the warnings as errors, and validate at the boundaries.
- LINQ is lazy. `ToList()` is the "run it now" button.
- `Task` is a promise with cancellation built in; never block on it.
- Dependencies come from the DI container, and lifetimes (`Singleton`, `Scoped`, `Transient`) are the concept to learn first.

## Further Reading

- [Nullable reference types (Microsoft Learn)](https://learn.microsoft.com/dotnet/csharp/fundamentals/null-safety/nullable-reference-types)
- [Records (C# reference)](https://learn.microsoft.com/dotnet/csharp/language-reference/builtin-types/record)
- [Introduction to LINQ queries](https://learn.microsoft.com/dotnet/csharp/linq/get-started/introduction-to-linq-queries)
- [Task asynchronous programming model](https://learn.microsoft.com/dotnet/csharp/asynchronous-programming/task-asynchronous-programming-model)
- [What's new in C# 14](https://learn.microsoft.com/dotnet/csharp/whats-new/csharp-14)
