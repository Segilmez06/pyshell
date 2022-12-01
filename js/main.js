var terminalOptions = {
    allowProposedApi: true,
    cursorStyle: 'bar',
    cursorBlink: true,
    fontFamily: 'Roboto Mono, Ubuntu Mono, courier-new, courier, monospace',
    theme: {
        background: '#2d2e2c',
        cursor: '#489ce2'
    }
};


document.addEventListener('DOMContentLoaded', pageLoaded);
window.addEventListener('resize', pageResized);

async function pageLoaded(){
    window.term = new Terminal(terminalOptions);
    window.fitAddon = new FitAddon.FitAddon();
    term.open($("#terminal")[0]);
    term.write("Initializing PyShell...\n\r")
    term.loadAddon(fitAddon);
    fitAddon.fit();
    term.prompt = () => { term.write('\n\r>>> '); };

    window.pyodide = await loadPyodide();
    pyodide.runPython(`
        import sys, io, traceback
        out = io.StringIO()
        sys.stdout = out
        sys.stderr = out
    `);

    // # namespace = {"shell"}  # use separate namespace to hide run_code, modules, etc.
    // def run_code(code, namespace):
    //     """run specified code and return stdout and stderr"""
    //     out = io.StringIO()
    //     oldout = sys.stdout
    //     olderr = sys.stderr
    //     sys.stdout = sys.stderr = out
    //     try:
    //         # change next line to exec(code, {}) if you want to clear vars each time
    //         exec(code, namespace)
    //     except:
    //         traceback.print_exc()
    
    //     # sys.stdout = oldout
    //     # sys.stderr = olderr
    //     return out.getvalue()

    let pyVersionString = pyodide.runPython(`f"Python {__import__('sys').version.split(' ')[0]} on Pyodide"`);
    term.write(pyVersionString);
    term.prompt();
    
    window.shell = {
        cursorX: 0,
        cursorY: 0,
        line: ""
    };
    window.shell.cursorX = 0;
    window.shell.cursorY = 2;
    window.shell.line = "";

    term.onKey(function(e) {
        console.log(e);

        let key = e.key;
        let event = e.domEvent;
        let keyCode = event.keyCode;

        if(keyCode == 8){
            // Backspace
            if(shell.cursorX > 0){
                shell.cursorX--;
                shell.line = shell.line.slice(0, -1);
                term.write("\b \b");
            }
        }
        else if(keyCode == 13){
            // Enter
            let line = shell.line;
            shell.line = "";
            shell.cursorX = 0;
            console.debug(line);

            try {
                let query = pyodide.runPython(line);
                if(query != null && query != undefined){
                    term.write("\n\r");
                    term.write(String(query));
                }
            } catch (error) {
                let errorArray = String(error).split('\n');
                let err = errorArray[errorArray.length - 2];
                term.write("\n\r" + err);
                console.error(error);
            }
            // term.write("\n\r");
            term.prompt();
        }
        else if(keyCode == 37){
            // Left
            if(shell.cursorX > 0){
                shell.cursorX--;
                term.write("\b");
            }
        }
        else if(keyCode == 39){
            // Right

        }
        else {
            shell.line = [shell.line.slice(0, shell.cursorX), key, shell.line.slice(shell.cursorX)].join('');
            // shell.line[shell.cursorX] = key;
            shell.cursorX += 1;
            term.write(shell.line.slice(shell.cursorX - 1));
            if(shell.cursorX < shell.line.length){
                term.write("\b".repeat(shell.line.length - shell.cursorX));
            }
        }
    });
    
}

async function pageResized(){
    fitAddon.fit();
}

// var term = new Terminal({
//     cursorBlink: "block"
// });

// var curr_line = '';
// var entries = [];
// var currPos = 0;
// var pos = 0;

// term.open(document.getElementById('terminal'));
// term.prompt = () => {
//     term.write('\n\r' + curr_line + '\r\n\u001b[32mscm> \u001b[37m');
// };
// term.write('Welcome to my Scheme web intepreter!');
// term.prompt();

// term.on('key', function(key, ev) {
//     const printable = !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey &&
//         !(ev.keyCode === 37 && term.buffer.cursorX < 6);

//     if (ev.keyCode === 13) { // Enter key
//         if (curr_line.replace(/^\s+|\s+$/g, '').length != 0) { // Check if string is all whitespace
//             entries.push(curr_line);
//             currPos = entries.length - 1;
//             term.prompt();
//         } else {
//             term.write('\n\33[2K\r\u001b[32mscm> \u001b[37m');
//         }
//         curr_line = '';
//     } else if (ev.keyCode === 8) { // Backspace
//         if (term.buffer.cursorX > 5) {
//             curr_line = curr_line.slice(0, term.buffer.cursorX - 6) + curr_line.slice(term.buffer.cursorX - 5);
//             pos = curr_line.length - term.buffer.cursorX + 6;
//             term.write('\33[2K\r\u001b[32mscm> \u001b[37m' + curr_line);
//             term.write('\033['.concat(pos.toString()).concat('D')); //term.write('\033[<N>D');
//             if (term.buffer.cursorX == 5 || term.buffer.cursorX == curr_line.length + 6) {
//                 term.write('\033[1C')
//             }
//         }
//     } else if (ev.keyCode === 38) { // Up arrow
//         if (entries.length > 0) {
//             if (currPos > 0) {
//                 currPos -= 1;
//             }
//             curr_line = entries[currPos];
//             term.write('\33[2K\r\u001b[32mscm> \u001b[37m' + curr_line);
//         }
//     } else if (ev.keyCode === 40) { // Down arrow
//         currPos += 1;
//         if (currPos === entries.length || entries.length === 0) {
//             currPos -= 1;
//             curr_line = '';
//             term.write('\33[2K\r\u001b[32mscm> \u001b[37m');
//         } else {
//             curr_line = entries[currPos];
//             term.write('\33[2K\r\u001b[32mscm> \u001b[37m' + curr_line);

//         }
//     } else if (printable && !(ev.keyCode === 39 && term.buffer.cursorX > curr_line.length + 4)) {
//         if (ev.keyCode != 37 && ev.keyCode != 39) {
//             var input = ev.key;
//             if (ev.keyCode == 9) { // Tab
//                 input = "    ";
//             }
//             pos = curr_line.length - term.buffer.cursorX + 4;
//             curr_line = [curr_line.slice(0, term.buffer.cursorX - 5), input, curr_line.slice(term.buffer.cursorX - 5)].join('');
//             term.write('\33[2K\r\u001b[32mscm> \u001b[37m' + curr_line);
//             term.write('\033['.concat(pos.toString()).concat('D')); //term.write('\033[<N>D');
//         } else {
//             term.write(key);
//         }
//     }
// });

// term.on('paste', function(data) {
//     curr_line += data;
//     term.write(curr_line);
// });