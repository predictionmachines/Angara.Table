namespace System
open System.Reflection

[<assembly: AssemblyTitleAttribute("Angara.Table")>]
[<assembly: AssemblyProductAttribute("Angara.Table")>]
[<assembly: AssemblyDescriptionAttribute("A .NET library to work with plain tables.")>]
[<assembly: AssemblyVersionAttribute("0.2.2")>]
[<assembly: AssemblyFileVersionAttribute("0.2.2")>]
do ()

module internal AssemblyVersionInformation =
    let [<Literal>] Version = "0.2.2"
    let [<Literal>] InformationalVersion = "0.2.2"
