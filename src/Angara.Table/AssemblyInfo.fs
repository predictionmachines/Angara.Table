namespace System
open System.Reflection

[<assembly: AssemblyTitleAttribute("Angara.Table")>]
[<assembly: AssemblyProductAttribute("Angara.Table")>]
[<assembly: AssemblyDescriptionAttribute("A .NET library to work with plain tables.")>]
[<assembly: AssemblyVersionAttribute("0.2.4")>]
[<assembly: AssemblyFileVersionAttribute("0.2.4")>]
do ()

module internal AssemblyVersionInformation =
    let [<Literal>] Version = "0.2.4"
    let [<Literal>] InformationalVersion = "0.2.4"
