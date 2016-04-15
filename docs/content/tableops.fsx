(*** hide ***)
#I "../../bin/Angara.Table"
#r "System.Collections.Immutable.dll"
#r "Angara.Table.dll"
   
open Angara.Data
open System
open System.Collections.Generic
open System.Collections.Immutable

(**

Table Operations
================


[Angara.Data.Table](angara-data-table.html) exposes a set of functions that should simplify a code
operating with tables, though payoff is that the type checking is performed in runtime.
*)

(**

### Duplicate Names Disambiguation 

All functions described below identify a column by its name. Thus duplicate names cause ambiguity which is implicitly resolved
by choosing the first column having the given name. Still you can explicitly resolve the ambiguity using one of the following approaches:

1. If only one of the columns is needed, then you can build a new table that 
has all columns excluding unnecessary. 
2. If multiple columns with same name are necessary, build a new table that has same columns but with unique names.

None of the approaches causes column data evaluation or copying.

For example, if `table` has several columns named `"x"` and you need only one with index 0,
build a table that contains the only needed column `"x"`:
*)

let table2 =
    table
    |> Seq.mapi (fun i c -> i, c)
    |> Seq.choose (fun (i, c) -> 
        match c.Name with
        | "x" when i <> 0 -> None
        | _ -> Some c)
    |> Table.OfColumns

(** Next example renames columns named `"x"` by appending the column index to the name: *)

let table3 =
    table
    |> Seq.mapi (fun i c -> 
        match c.Name with
        | "x" -> Column.Create (sprintf "x (%d)" i, c.Rows, c.Height)
        | _ -> c)
    |> Table.OfColumns

(**
### Mapping Rows

#### Table.Map, Table.Mapi

The function `Table.Map` builds a sequence whose elements are the results of applying the given function to each of the rows of certain table columns.
`Table.Mapi` also provides an integer index passed to the function which indicates the index of row being transformed.

The signature is: `Map<'a,'b,'c> : columnNames:seq<string> -> map:('a->'b) -> table:Table -> 'c seq`

The generic function `map:'a->'b` is only partially defined. If `columnNames` contains:

* 0 columns, then `map:unit->'c`, so `'a = unit`, `'b = 'c`
* 1 column, then `map:'a->'c`, where `'a` is the type of the column, the function result type is `'b = 'c`
* 2 columns, then `map:'a->'d->'c`, where `'a` and `'d` are the types of the columns, so `'b = 'd->'c`
* 3 columns, then `map:'a->'d->'e->'c`, where `'a`, `'d` and `'e` are the types of the columns, so `'b = 'd->'e->'c`
* n...

The following example produces a sequence of multiplied values of columns `"x"` and `"sin(x)"` for each of the table rows:
*)

let xsinx : float seq = 
    table
    |> Table.Map ["x"; "sin(x)"] (fun (x:float) (sinx:float) -> x*sinx)    

(*** include-value:xsinx ***)


(**

#### Table.MapToColumn, Table.MapiToColumn

The function `Table.MapToColumn` builds a new table that contains all columns of the given table and
a new column or a replacement of an original table column (if there is an existing column with same name as the target name); 
elements of the column are the results of applying the given function to each of the rows of the given table columns. 
`Table.MapiToColumn` also provides an integer index passed to the function which indicates the index of row being transformed.

The signature is: `MapToColumn : newColumnName:string -> columnNames:seq<string> -> map:('a->'b) -> table:Table -> Table`

The generic function `map:'a->'b` is only partially defined. If `columnNames` contains:

* 0 columns, then `map:unit->'b`, so `'a = unit` and the new column type is `'b`
* 1 column, then `map:'a->'b`, where `'a` is the type of the source column, and `'b` is the new column type
* 2 columns, then `map:'a->'d->'c`, where `'a` and `'d` are the types of the source columns, so `'b = 'd->'c`, and `'c` is the new column type
* 3 columns, then `map:'a->'d->'e->'c`, where `'a`, `'d` and `'e` are the types of the source columns, so `'b = 'd->'e->'c`, and `'c` is the new column type
* n...

Ultimate result type of the `map` function must be valid column type: either `int`, `float`, `string`, `bool` or `DateTime`.

The following examples adds new table column named `"log(x)"` which contains logarithm of the column `"x"` value for each of the table rows:
*)

let tableLog = table |> Table.MapToColumn "log(x)" ["x"] log

(*** include-value: tableLog ***)

(**
### Filtering Rows

The function `Table.Filter` returns a new table containing only the rows of the table for which the given predicate returns `true`.
The predicate gets values of the given columns only. `Table.Filteri` also provides an integer index passed to the predicate which indicates the index of row being filtered.

The signature is: `Filter : columnNames:seq<string> -> predicate:('a->'b) -> table:Table -> Table`

The generic function `predicate:'a->'b` is only partially defined. If `columnNames` contains:

* 1 column, then `predicate:'a->bool`, where `'a` is the type of the column, and `'b = bool`
* 2 columns, then `predicate:'a->'d->bool`, where `'a` and `'d` are the types of the columns, and `'b = 'd->bool`
* 3 columns, then `predicate:'a->'d->'e->bool`, where `'a`, `'d` and `'e` are the types of the columns, and `'b = 'd->'e->bool`
* n...
*)

(** 
The following example creates a table that contains only the rows of the `table` where value of 
the column `"x"` is between 0 and 1:
*)

let table_filter_x = table |> Table.Filter ["x"] (fun x -> x >= 0.0 && x <= 1.0) 
(*** include-value: table_filter_x ***)

(** To get a subset of table rows by row index, use the function `Table.Filteri`. The following example builds a table that contains only first 10 rows of the original table: *)

let table_10rows = table |> Table.Filteri [] (fun i -> i < 10)

(**
### Concatenating Tables

The function `Table.Append` returns a new table that contains the columns of both given tables in order. 
Duplicate column names are allowed. Heights of the tables must be equal.

The signature is: `Table.Append : table1:Table -> table2:Table -> Table`

### Transforming Tables

The function `Table.Transform` applies the given function to the values of the given table columns and returns the function result.
Each column is represented as an immutable array.

The signature is: `Transform<'a,'b,'c> : columnNames:seq<string> -> transform:(ImmutableArray<'a>->'b) -> table:Table -> 'c`

The generic function `transform:ImmutableArray<'a>->'b` is only partially defined. If `columnNames` contains:

* 1 column, then `transform:ImmutableArray<'a>->'c`, where `'a` is the type of the column, so `'b = 'c`.
* 2 columns, then `transform:ImmutableArray<'a>->ImmutableArray<'d>->'c`, where `'a` and `'d` are the types of the columns, so `'b = ImmutableArray<'d>->'c`
* n...

The following example computes the midpoint approximation to the integral of `sin(x)` using the table containing columns "x" and "sin(x)":
*)

open System.Collections.Immutable

let approxIntegr (x:ImmutableArray<float>) (y:ImmutableArray<float>) =
    let mutable sum = 0.0
    for i in 0..x.Length-2 do sum <- sum + y.[i] * (x.[i+1] - x.[i])
    sum

let integr : float = table |> Table.Transform ["x";"sin(x)"] approxIntegr

(*** include-value:integr ***)

(** The next example builds a new table which contains a single column with running maximum of the column "sin(x)" of the existing table: *)

let getRunningMax(values: ImmutableArray<float>) = 
    values 
    |> Seq.skip 1
    |> Seq.scan(fun max sin -> if sin > max then sin else max) values.[0]

let tableMax : Table =
    table 
    |> Table.Transform ["sin(x)"] (fun (sinx:ImmutableArray<float>) ->
        Table.OfColumns [ Column.Create("running max of sin(x)", getRunningMax sinx) ])

(*** include-value:tableMax ***)

(** There are cases when the table produced by `Transform` should be appended to the original table.
The function `Table.AppendTransform` transforms the original table and then concatenates the original and transformed tables: *)

let tableWithMax : Table =
    table 
    |> Table.AppendTransform ["sin(x)"] (fun (sinx:ImmutableArray<float>) ->
        Table.OfColumns [ Column.Create("running max of sin(x)", getRunningMax sinx) ])

(*** include-value:tableWithMax ***)

(** The signature is: `AppendTransform : columnNames:seq<string> -> transform:(ImmutableArray<'a>->'b) -> table:Table -> Table`

It is similar to the `Transform` function but here the ultimate result type of the partially defined function `transform` must be `Table`. *)
