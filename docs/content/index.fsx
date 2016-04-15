(*** hide ***)
#I "../../bin/Angara.Table"
#r "System.Collections.Immutable.dll"
#r "Angara.Table.dll"
   
open Angara.Data
open System
open System.Collections.Generic
open System.Collections.Immutable

(**
Angara.Table (F#)
======================

Angara.Table is a .NET library that provides types representing plain tables.
It allows loading and saving tables and facilitates operations on tables.

A table is an immutable collection of named columns. 
Column values are represented as lazy one-dimensional immutable array of one of the supported types. 
Heights of all columns in a table are equal.
Columns names are arbitrary strings;
duplicate names are allowed but may cause ambiguity in some API functions.

Limiting the supported column types to relatively small types subset enables generic tools 
operating with tables, such as serialization services and visualization, to be able to handle all possible types.

Example
-------

This example uses Angara.Table to create a table from numeric arrays and save the table as a CSV file:

*)

open Angara.Data

let table = Table.OfColumns
                [ Column.Create ("x", [| for i in 0..99 -> float(i) / 10.0  |])
                  Column.Create ("sinx", [| for i in 0..99 -> sin (float(i) / 10.0) |]) ]
Table.Save(table, "table.csv")


(** The following example computes an average value of the column `"sinx"`: *)

let sinAvrg = table.["sinx"].Rows.AsReal |> Seq.average

(** The next example views rows of the table as a sequence of the record instances: *)

type T = { x: float; sinx: float }
let rows : T seq = table.ToRows<T>()

(** Finally, this example loads a table from the CSV file and extends it with a new column built from another column: *)

let table2 = 
    Table.Load "table.csv" 
    |> Table.MapToColumn "logx" ["x"] log

(*** include-value: table2 ***)


(**

How to get Angara.Table
-----------------------

<div class="row">
  <div class="span1"></div>
  <div class="span6">
    <div class="well well-small" id="nuget">
      The Angara.Table library can be <a href="https://nuget.org/packages/Angara.Table">installed from NuGet</a>:
      <pre>PM> Install-Package Angara.Table</pre>
    </div>
  </div>
  <div class="span1"></div>
</div>

Samples & Documentation
-----------------------

A table of Angara.Table is basically an immutable collection of named columns. 
The [Table as Collection of Columns](tablecolumns.html) describes 
how to create a column and a table from a sequence of columns;
how to add and remove columns;
how to view column as an array of values and fetch an individual value from a table.

Sometimes it is necessary to view a table as a collection of rows.
The [Table as Collection of Rows](tablerows.html) describes how to get number of rows;
how to get values of rows; how to represent table rows as a collection of typed objects.

The special case is a table having all columns of same type. The [Table as Matrix](matrix.html) describes
how to create a matrix table and operate with it.

Angara.Table allows to save and load a table in the delimited text format (CSV). 
See [Save and Load](saveload.html).

Angara.Table exposes a set of functions manipulating with `Table` that should make a code more succinct.
These functions are described in [Table Operations](tableops.html).


*)


(**
Contributing and copyright
--------------------------

The project is hosted on [GitHub][gh] where you can [report issues][issues], [fork 
the project][fork] and submit pull requests. If you're adding a new public API, please also 
consider adding [samples][content] that can be turned into a documentation. You might
also want to read the [library design notes][readme] to understand how it works.

The library is available under MIT license. For more information see the 
[License file][license] in the GitHub repository. 

  [content]: https://github.com/predictionmachines/Angara.Table/tree/master/docs/content
  [gh]: https://github.com/predictionmachines/Angara.Table
  [fork]: https://github.com/Microsoft/Angara.Table
  [issues]: https://github.com/Microsoft/Angara.Table/issues
  [readme]: https://github.com/Microsoft/Angara.Table/blob/master/README.md
  [license]: https://github.com/Microsoft/Angara.Table/blob/master/LICENSE.txt
*)

