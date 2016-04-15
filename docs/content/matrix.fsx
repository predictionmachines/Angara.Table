(*** hide ***)
#I "../../bin/Angara.Table"
#r "System.Collections.Immutable.dll"
#r "Angara.Table.dll"
   
open Angara.Data
open System
open System.Collections.Generic
open System.Collections.Immutable

(**

Table as Matrix
===============

The special case is the table having all columns of same type; we call it a matrix table and there is a specific
type `MatrixTable<'v>` which inherits from the `Table` and allows efficiently get values both by rows and columns, 
and extend the table in both directions.

To create a matrix table, use `Table.OfMatrix` and provide the matrix as a sequence of rows:

*)

let tableMatrix = Table.OfMatrix [| [|11;12;13|]; [|21;22;23|] |]
(*** include-value:tableMatrix ***)
(**
Additionally, you can provide optional names for columns; if not, the columns get default names
"A", "B", ..., "Z", "AA", "AB", .... To get a default column name from a column index, use the function
`Table.DefaultColumnName`.

The properties `Rows` and `Columns` return two-dimensional immutable arrays containing table values 
by rows and by columns respectively:
*)

let matrixRows = tableMatrix.Rows
(*** include-value:matrixRows ***)

let matrixCols = tableMatrix.Columns
(*** include-value:matrixCols ***)

(** To get a value from row and column indices, use the indexed property `Item`: *)

let value = tableMatrix.[0, 0]
(*** include-value:value ***)

(** Matrix table allows adding rows using `AddRows` and `AddRow` functions: *)

let tableMatrix' = tableMatrix.AddRow [|31;32;33|]
(*** include-value:tableMatrix' ***)

(** To add columns, concatenate two matrix tables having same element type and height using 
function `Table.AppendMatrix`: *)

let tableMatrix'' = 
    Table.OfMatrix ([| [|14|]; [|24|] |], [Table.DefaultColumnName 3])
    |> Table.AppendMatrix tableMatrix 
(*** include-value:tableMatrix'' ***)