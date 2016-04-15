(*** hide ***)
#I "../../bin/Angara.Table"
#r "System.Collections.Immutable.dll"
#r "Angara.Table.dll"
   
open Angara.Data
open System
open System.Collections.Generic
open System.Collections.Immutable

(**

Table as Collection of Rows
================================

We described that a table of Angara.Table is basically an immutable collection of named columns, 
[Table as Collection of Columns](tablecolumns.html). Still sometimes it is necessary to view it as a collection of rows. 

In the examples here we will use the table containing the columns `"x"` and `"sin(x)"`: *)

let table = 
    Table.OfColumns
        [ Column.Create ("x", [| for i in 0..99 -> float(i) / 10.0  |])
          Column.Create ("sin(x)", [| for i in 0..99 -> sin (float(i) / 10.0) |]) ]

(**
A number of rows in the table is available through the property `RowsCount`:
*)

(*** define-output:rowscount ***)
printf "Rows count: %d" table.RowsCount
(*** include-output:rowscount ***)

(**

There are three ways to perform row-wise data access:

* Get column values then do explicit slicing:
*)
let rows : (float*float) seq = 
    let x = table.["x"].Rows.AsReal
    let sinx = table.["sin(x)"].Rows.AsReal
    seq{ for i in 0..table.RowsCount-1 -> x.[i], sinx.[i] }

(*** include-value:rows ***)

(**
* Use helper function `Table.Map` which invokes the given function for each of the table rows and provides values of certain columns as arguments
(see [Table Operations](tableops.html#Table-Map-Table-Mapi));
the result is a sequence of values returned by the function calls: 
*)
let rows' : (float*float) seq =
    table |> Table.Map ["x";"sin(x)"] (fun (x:float) (sinx:float) -> x, sinx)

(*** include-value:rows' ***)

(** 
* If table schema is known and a row can be represented as a record, you can use the generic function `Table.ToRows<'r>` which returns `'r seq`,
one instance of `'r` for each of the rows. Note that the record may not have a property for each of the table columns. *)

type SinX = { x: float; ``sin(x)``: float }
let rows'' : SinX seq = table.ToRows<SinX>()

(*** include-value:rows'' ***)

(** 

#### Typed Table

The typed table is a table that exposes its rows as a collection of typed instances. It is represented as a generic
type `Table<'r>` inherited from `Table`.

The function `Table.OfRows<'r>` creates an instance of type `Table<'r>`, 
such that each public property of a given type `'r` 
becomes the table column with the name and type identical to the property;
each table row corresponds to an element of the input sequence with the order respected.
If the type `'r` is an F# record, the order of columns is identical to the record properties order.
If there is a public property having a type that is not valid for a table column, the function fails with an exception.

*)

let tableSinX : Table<SinX> = Table.OfRows rows''
(*** include-value:tableSinX ***)

(** The `Table<'r>` exposes the `Rows` property which returns table rows as `ImmutableArray<'r>`: *)

let sinRow : SinX = tableSinX.Rows.[0]

(*** include-value:sinRow ***)

(** The type `Table<'r>` allows efficiently appending a table with new rows:
*)

let tableSinX' = 
    tableSinX.AddRows (seq{ for i in 100..199 -> let x = float(i)/10.0 in { x = x; ``sin(x)`` = sin x } })

(*** include-value:tableSinX' ***)