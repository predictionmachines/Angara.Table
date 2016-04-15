(*** hide ***)
#I "../../bin/Angara.Table"
#r "System.Collections.Immutable.dll"
#r "Angara.Table.dll"
   
open Angara.Data
open System
open System.Collections.Generic
open System.Collections.Immutable

(**

Table as Collection of Columns
================================

A table is an immutable collection of named columns. 
Column values are represented as lazy one-dimensional immutable array of one of the supported types. 
Heights of all columns in a table are equal.
Columns names are arbitrary strings;
duplicate names are allowed but may cause ambiguity in some API functions.

Here we describe how the column and the column-based table are represented.
See also [Table as Collection of Rows](tablerows.html) to work with table rows.

*)

(**
Column
------

A column is represented as an immutable type `Angara.Data.Column` which
keeps column name, height and values. Column name cannot be a null string. *)

(*** include:typedef-Column ***)

(**
Column values are represented as an instance of discriminated union `Angara.Data.ColumnValues`:
*)

(*** include:typedef-ColumnValues ***)

(** The [ImmutableArray<'a>](https://msdn.microsoft.com/en-us/library/dn638264(v=vs.111).aspx)
structure represents an array that cannot be changed once it is created. Use of 
[Lazy<'a>](https://msdn.microsoft.com/en-us/library/dd233247.aspx) enables evaluation of
the column array on demand. 

To create a column, use overloaded static methods `Column.Create` and `Column.CreateLazy`.
Let we have a sequence `xs` and want to create a corresponding column named `"x"`: *)

let xs = seq{ for i in 0..99 -> float(i) / 10.0  }

(**
- Use `Column.Create` to build a column from a string name and a sequence of values. 
If the given sequence is a mutable array, it is copied to guarantee immutability of the column; 
if the sequence is an immutable array, it is used as is without copying; 
otherwise, if none of above, an immutable array is built from the sequence. *)

let cx = Column.Create ("x", xs)

(** 
- If you provide an optional argument `count` to the `Column.Create`, the given sequence will be enumerated
only when the column values are first time accessed. The given `count` is the number of elements in the sequence.
If the real sequence length will be different than specified, a runtime exception will occur when values are requested. *)

let lazyCx = Column.Create ("x", xs, 100)

(**
- Another way to create a lazy column is to use `Column.CreateLazy` which takes a `Lazy` instance producing an immutable array, and the number of elements.
Evalutation of the array will be performed when the column values are first time accessed.*)
let lazyCx' = Column.CreateLazy ("x", lazy(ImmutableArray.CreateRange xs), 100)

(**
- To build a column with same values but different name, call `Colum.Create` and pass an instance of the `ColumnValues`. *)
let cx2 = Column.Create ("x2", cx.Rows, cx.Height)

(**
### Getting Column Values

Generic tools usually do not expect a column to have a certain type, but must handle all possible types.
In this case, use `match` by value of the `Column.Rows` property to get column values.
The following example prints values of the column: *)

(*** define-output:print-rows ***)
match cx.Rows with
| RealColumn v -> printf "floats: %A" v.Value
| IntColumn v -> printf "ints: %A" v.Value
| StringColumn v -> printf "strings: %A" v.Value
| DateColumn v -> printf "dates: %A" v.Value
| BooleanColumn v -> printf "bools: %A" v.Value
(*** include-output:print-rows ***)

(**
When a column is expected to be of a certain type, use one of the functions `ColumnValues.AsReal`,
`ColumnValues.AsInt`, `ColumnValues.AsString`, `ColumnValues.AsDate`, `ColumnValues.AsBoolean`
which evaluate the column array (if it is not evaluated yet) and return the `ImmutableArray<'a>` instance, 
assuming that the column type corresponds the function;
otherwise, if the column type is incorrect, the function fails. 
*)

let x : ImmutableArray<float> = cx.Rows.AsReal

(*** include-value:x ***)

(** Also, the type `ColumnValues` allows getting an individual data value by an index; again, 
there is a generic approach based on `match` and a succinct approach when a certain type is expected.

The following example returns a median of the ordered column `cx` when type is unknown:
*)

(*** define-output:print-rows-item ***)
match cx.Rows.[cx.Height / 2] with
| RealValue v -> printf "float: %f" v
| IntValue v -> printf "int: %d" v
| StringValue v -> printf "string: %s" v
| DateValue v -> printf "date: %A" v
| BooleanValue v -> printf "bool: %A" v
(*** include-output:print-rows-item ***)

(** The next example assumes that the column is real:*)
(*** define-output:print-rows-item2 ***)
printf "float: %f" (cx.Rows.[cx.Height / 2].AsReal)
(*** include-output:print-rows-item2 ***)

(**

Table
-----

The type `Angara.Data.Table` represents an immutable table. *)

(*** include:typedef-Table ***)

(** The `Table.Empty` property returns an empty table, i.e. a table that has no columns.

A table can be created from a finite sequence of columns:
*)

let table = 
    Table.OfColumns
        [ Column.Create ("x", xs)
          Column.Create ("sin(x)", xs |> Seq.map sin) ]

(**
To add a column to a table, you can use the static function `Table.Add` which creates 
a new table that has all columns of the original table appended with the given column.
Duplicate names are allowed. 
Normally, all columns of a table must have same height which is the table row count; 
if the new table column has different height, `Table.Add` fails.

In the following example the resulting `table` is identical to the `table` of the previous example:
*)

let table =
    Table.Empty 
    |> Table.Add (Column.Create ("x", xs))
    |> Table.Add (Column.Create ("sin(x)", xs |> Seq.map sin))

(** To remove columns from a table by names, you can use `Table.Remove`: *)

let table2 = table |> Table.Remove ["sin(x)"]

(** The `Table` implements the `IEnumerable<Column>` interface and you can manipulate with a table 
as a sequence of columns. For example, the following code removes all columns but first: *)

let table3 = table |> Seq.take 1 |> Table.OfColumns

(** The following example prints a schema of the table without evalutation of the columns values: *)
(*** define-output:table-as-seq ***)
table
|> Seq.iteri (fun colIdx col ->
    printfn "%d: %s of type %s" colIdx col.Name
                (match col.Rows with
                | RealColumn _    -> "float"
                | IntColumn _     -> "int"
                | StringColumn _  -> "string"
                | DateColumn _    -> "DateTime"
                | BooleanColumn _ -> "bool"))

(*** include-output:table-as-seq ***)  

(** The `Table` exposes members `Count`, `Item` and `TryItem` that allow to get a count of the total number of columns in the table
and get a column by its index or name.

In particular, the `Table.Item` is an indexed property finding a column. If a column is not found,
an exception is thrown; if there are two or more columns with the given name, the first column having the name is returned.

The example gets a name of a table column with index 1: *)

let col_name = table.[1].Name

(*** include-value:col_name ***)

(**
Next, we compute an average of the column named "sin(x)", assuming that it is real:
*)
let sin_avg = table.["sin(x)"].Rows.AsReal |> Seq.average

(*** include-value:sin_avg ***)






(*** define:typedef-Column ***)
type Column =
    /// Gets a name of the column.
    member Name : string with get
    /// Gets a number of rows in the column.
    member Height : int with get
    /// Returns column values.
    member Rows : ColumnValues with get

(*** define:typedef-ColumnValues ***)
type ColumnValues =
    | IntColumn     of Lazy<ImmutableArray<int>>
    | RealColumn    of Lazy<ImmutableArray<float>>
    | StringColumn  of Lazy<ImmutableArray<string>>
    | DateColumn    of Lazy<ImmutableArray<DateTime>>
    | BooleanColumn of Lazy<ImmutableArray<Boolean>>

(*** define:typedef-Table ***)
type Table = 
    interface IEnumerable<Column> 
    /// Gets a count of the total number of columns in the table.
    member Count : int with get
    /// Gets a count of the total number of rows in the table.
    member RowsCount : int with get
    /// Gets a column by its index.
    member Item : index:int -> Column with get
    /// Gets a column by its name.
    /// If there are several columns with same name, returns the fist column having the name.
    member Item : name:string -> Column with get
    /// Tries to get a column by its index.
    member TryItem : index:int -> Column option with get
    /// Tries to get a column by its name.
    /// If there are several columns with same name, returns the fist column having the name.
    member TryItem : name:string -> Column option with get   
