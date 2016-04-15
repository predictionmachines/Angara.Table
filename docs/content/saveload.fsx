(*** hide ***)
#I "../../bin/Angara.Table"
#r "System.Collections.Immutable.dll"
#r "Angara.Table.dll"
   
open Angara.Data
open System
open System.Collections.Generic
open System.Collections.Immutable

(**

Save and Load
=============

The `Table` type exposes static functions `Save` and `Load` to save and load a table in the delimited text format (CSV)
in accordance with [RFC 4180](https://tools.ietf.org/html/rfc4180) but with extended set of delimiters: comma, tab, semicolon and space.

The `Table.Save` function saves a table to a file or using given `TextWriter`: *)

Table.Save(table, "table.csv")

(** The `table.csv` contains the following text: 

    x,sin(x)
    0,0
    0.1,0.099833416646828155
    0.2,0.19866933079506122
    0.3,0.29552020666133955
    ...
*)

(**
To load a table from a delimited text file, such as CSV file, or using given `TextReader`, you can call 
`Table.Load` function:
*)

let table = Table.Load "table.csv"

(** 

The overloaded functions `Load` and `Save` allow to provide custom settings,
such as specific delimiter, header, support of null strings, and predefined columns count and types. 

### Column Type Inference

`Table.Load` infers columns types from the text. Note that by default numeric values are always read as `float` 
and never as `int` to avoid ambiguity. If you need an integer column, you can provide custom settings to the 
`Load` function with specific `ColumnTypes` function.
*)

(** 

#### Typed Table

To load a typed table, use the following snippet: *)

type SinX = { x: float; ``sin(x)``: float }

let tableSinX : Table<SinX> = 
    (Table.Load "table.csv").ToRows<SinX>()
    |> Table.OfRows

(**

Read more about typed tables in [Table as Collection of Rows](tablerows.html#Typed-Table).

*)


(**

#### Null and Empty Strings

By default, `Save` fails if the table contains null strings to avoid ambiguity with empty strings.
If the custom `WriteSettings` provided to the `Save` method and its `AllowNullStrings` is true, 
it saves a null string as an empty string and an empty string as two double quotes ("").
The default `Load` both empty string and two double quotes reads as an empty string; 
if custom `ReadSettings` has `InferNullStrings` set to true, double quotes ("") are considered as empty string and an empty string is considered as null.
*)