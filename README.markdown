Dialectic JavaScript
====================

Usage:

http://.../repl.html

Enter code in the input box and it shall be eval'd. Use the Up and Down keys to browse input history.
Above the input is the current context, which is `with`'d into the scope of every evaluation.

Also `with`'d into scope is the REPL object, which contains many useful commands, as well as
a ton of ugly implementation (hey, it's a work in progress). Commands are just functions,
but if you want to call a function at the top level of your input, there is a convenient shorthand
syntax to save your wrists from annihilation:

    foo(1,2,3)      =>      /foo 1,2,3

The results of your machinations are appended to the output window, which is that big black space.
Try clicking on values and objects in the output to insert them into your current input.
Strings and numbers will just be copied verbatim and big objects will be inserted as a reference,
like `value[42]`.


Commands
--------
    
Here is a sampling of the many succulent commands. You might find more if you poke around
in the REPL object, but you also might find a vortex of unfathomable madness.


    /p str                      Print string
    /i obj                      Inspect object briefly
    /ii obj                     Inspect object intensely
    /proto                      Inspect object with inherited properties
    /clear                      Clear the output window
    /cd obj                     Change the current context to `obj`
    /pop                        Go back to the previous context
    /multi                      Switch to multi-line input mode. You get a whole `&lt;textarea&gt;`
                                to type in. Press Ctrl-Enter to run your code.
                                Call `single()` to switch back.
    /canvas w,h                 Insert a canvas of the given dimensions in the background.
                                A 2D context is also created and put in the variable `ctx`.
                                This is a great little tool for tinkering with graphics code.
    /load uri                   Load a remote script using an XHR object
    /script uri                 Load a remote script using a dynamic `&lt;script&gt;` tag
    /reload                     Reload the most recently loaded script
    /GET uri,params,callback    Make an XHR GET request
    /POST uri,params,callback   Make an XHR POST request


I hacked this thing together quickly so I could experiment with the design. When the vision has fully
crystalized, I will likely rewrite most of it. That said, I do use it as a development tool every day.
If you have an amazing idea for where to take this thing, feel free to dump it in the wiki.