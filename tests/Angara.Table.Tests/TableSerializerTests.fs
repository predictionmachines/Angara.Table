﻿module TableSerializer.Tests

open NUnit.Framework
open FsUnit
open FsCheck
open Angara.Data
open Angara.Serialization

open Angara.Data.TestsF.Common

let buildReinstateLib() = 
    let lib = SerializerLibrary("Reinstate")
    Angara.Data.TableSerializers.Register([lib])
    SerializerCompositeResolver([ lib; CoreSerializerResolver.Instance ])

let buildHtmlLib() = 
    let lib = SerializerLibrary("Html")
    Angara.Data.TableSerializers.Register([lib])
    SerializerCompositeResolver([ lib; CoreSerializerResolver.Instance ])

[<Test; Category("CI")>]
let ``Serialization of a table to Json``() =
    let table = Table.OfColumns([   Column.Create("int", [| 1; 2; 3 |])
                                    Column.Create("float", [| 1.1; 1.2; 1.3 |])
                                    Column.Create("string", [| "a"; "b"; "c" |])
                                    Column.Create("bool", [| true; false; true |])
                                    Column.Create("date", [| System.DateTime(2020, 1, 1); System.DateTime(2020, 1, 2); System.DateTime(2020, 1, 3) |])])

    let lib = buildHtmlLib()
    let infoSet = table |> ArtefactSerializer.Serialize lib  
    let json = Angara.Serialization.Json.Marshal(infoSet, None)   
    System.Diagnostics.Trace.WriteLine(json)   
    Assert.AreEqual(":Table", json.First.Path); // todo: validate against schema so the expected json is as expected by TableViewer.show().


[<Test; Category("CI")>]
let ``Table with one float column is serialized``() =
    let data = [| 3.1415; 2.87; -1.0 |]
    let column = Column.Create("col1", data)
    let table = Table.Empty |> Table.Add column

    let lib = buildReinstateLib()
    let table2 = table |> ArtefactSerializer.Serialize lib |> ArtefactSerializer.Deserialize lib :?> Table

    table2 |> Angara.Data.TestsF.TableTests.colNames |> should equal [| "col1" |]

    let column2 = table2.["col1"]
    column2.Height |> should equal 3
    table2.RowsCount |> should equal 3
    column2.Rows.[0].AsReal |> should equal 3.1415
    column2.Rows.[1].AsReal |> should equal 2.87
    column2.Rows.[2].AsReal |> should equal -1.0

[<Test; Category("CI")>]
let ``Serialization of empty table`` () =
    let table = Table.Empty

    let lib = buildReinstateLib()    
    let table2 = table |> ArtefactSerializer.Serialize lib |> ArtefactSerializer.Deserialize lib :?> Table

    Assert.AreEqual(0, table2.Count)
    Assert.AreEqual(0, table2.RowsCount)

[<Test; Category("CI")>]
let ``Serialization of a table with a cell containing string 'null'`` () =
    let table = Table.OfColumns([Column.Create(":'}", [| null; "" |])])
    
    let lib = buildReinstateLib()    
    let table2 = table |> ArtefactSerializer.Serialize lib |> ArtefactSerializer.Deserialize lib :?> Table

    Assert.AreEqual(1, table2.Count)
    Assert.AreEqual(2, table2.RowsCount)
    Assert.AreEqual(":'}", table2.[0].Name)
    let deserializedArr = table2.[":'}"].Rows.AsString |> Angara.Data.TestsF.TableTests.toArr;
    Assert.AreEqual([| null; "" |], deserializedArr)

[<Test; Category("CI")>]
let ``Serialization of table with empty column name`` () =
    let table = Table.OfColumns([   Column.Create("", [|true;true;true;false|])
                                    Column.Create("VxD    ", [|-2.0; -2.0; System.Double.NaN; -2.666667|])
                                    Column.Create("\9K*", [|true;false;false;false|])])
    let lib = buildReinstateLib()
    let table2 = table |> ArtefactSerializer.Serialize lib |> ArtefactSerializer.Deserialize lib :?> Table
    Assert.IsTrue(Angara.Data.TestsF.Common.areEqualTablesForCsv table table2)


[<Property; Category("CI")>]
let ``A deserialized serialized table is identical to the original table`` (table: Table) =
    let lib = buildReinstateLib()
    let table2 = table |> ArtefactSerializer.Serialize lib |> ArtefactSerializer.Deserialize lib :?> Table
    Angara.Data.TestsF.Common.areEqualTablesForSerialization table table2

[<Test; Category("CI"); ExpectedException>]
let ``Adding a column with different length than existing`` () =
    let _ = 
        Table.Empty 
        |> Table.Add (Column.Create("a", [| 1 |]))
        |> Table.Add (Column.Create("b", [| 1; 2 |]))
    ()
    
[<Test; Category("CI"); ExpectedException>]
let ``Creating a table from two columns with different lengths`` () =
    let _ = Table.OfColumns([   Column.Create("a", [| 1 |])
                                Column.Create("b", [| 1; 2 |])])
    ()

[<Test; Category("CI")>]
let ``Serialization of table view`` () =
    let table = Table.Empty
    let settings = { TableViewSettings.DefaultPageSize = PageSize.Size25; DefaultTab = TableViewerTab.TabData; HideNaNs = true; CustomFormatters = [| "x", "return x.toFixed(2);" |] |> Map.ofArray }
    let view = { TableView.Table = table; ViewSettings = settings }

    let lib = buildReinstateLib()    
    let view2 = view |> ArtefactSerializer.Serialize lib |> ArtefactSerializer.Deserialize lib :?> TableView

    Assert.AreEqual(0, view2.Table.Count)
    Assert.AreEqual(0, view2.Table.RowsCount)
    Assert.AreEqual(settings, view2.ViewSettings)