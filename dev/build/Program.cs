using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace jtableBuilder
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 1 || string.IsNullOrEmpty(args[0]))
            {
                args = new[] { Path.Combine(Directory.GetCurrentDirectory(), @"..\..\..\CrudPlugInDevelop\Scripts\jtable\development\jquery.jtable.build.txt") };
            }

            var buildFilePath = args[0];
            var buildRoot = Path.GetDirectoryName(buildFilePath);
            var buildLines = File.ReadAllLines(buildFilePath);

            StreamWriter currentFile = null;
            foreach (var buildLine in buildLines)
            {
                var splittedLine = buildLine.Split(' ');
                var buildCommand = splittedLine[0];
                var buildArg = splittedLine[1];
                switch (buildCommand)
                {
                    case "create":
                        if (currentFile != null)
                        {
                            currentFile.Dispose();
                        }

                        currentFile = new StreamWriter(Path.Combine(buildRoot, buildArg), false, Encoding.UTF8);
                        break;
                    case "add":
                        if (currentFile == null)
                        {
                            continue;
                        }

                        currentFile.WriteLine(File.ReadAllText(Path.Combine(buildRoot, buildArg)));
                        currentFile.WriteLine();
                        break;
                }
            }

            if (currentFile != null)
            {
                currentFile.Dispose();
            }
        }
    }
}
