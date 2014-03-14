# builds a shell command which invokes cat on all files and redirects the
# output to ../jquery.jtable.js
# usage: 
#     cd jtable/dev; sed -n -f build/build.sed jquery.jtable.build.txt | sh
1{
i\
cat \\
}
/^add /{
    s/// 
    s/$/ \\/
    p
}
/^.*create.*\\/{ 
    s///;
    h;
    d 
}
${
    g;
    s/^/> ..\//;
    p 
}
