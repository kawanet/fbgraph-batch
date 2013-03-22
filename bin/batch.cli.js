#!/usr/bin/env node

var FBGraphBatch = require("../lib/batch");
var fs = require('fs');
var util = require('util');
var program = require('commander');
var pkg = require(__dirname + "/../package.json");

program.version(pkg.version);
program.usage('[options] <args ...>');
program.option('-j, --json', 'output as JSON (default)');
program.option('-c, --csv <columns>', 'output CSV with specified columns');
program.option('-i, --input <file>', 'input URL list from file');
program.option('-o, --output <file>', 'output results to file');
program.option('-t, --token <token>', '$FACEBOOK_ACCESS_TOKEN (required)');
program.option('-v, --verbose', 'show verbose messages');
program.parse(process.argv);

if (program.input == '-') {
    process.stdin.setEncoding('utf8');
    var buf = [];
    process.stdin.on('data', function(chunk) {
        buf.push(chunk);
    });
    process.stdin.on('end', function() {
        var list = buf.join("").split(/[\r\n]+/).filter(function(line) {return !!line;});
        main(list);
    });
    process.stdin.resume();
} else if (program.input) {
    fs.readFile(program.input, "utf-8", function(err, res) {
        if (err) {
            error(err);
        } else {
            var list = res.split(/[\r\n]+/).filter(function(line) {return !!line;});
            main(list);
        }
    });
} else {
    if (!program.args.length) {
        program.outputHelp();
        process.exit(1);
    }
    main(program.args);
}

function main(list) {
    // access token
    var token = program.token || process.env.FACEBOOK_ACCESS_TOKEN;
    var opts = {
        access_token: token
    };

    // call JavaScript API
    var fbbatch = new FBGraphBatch(opts);
    fbbatch.on("complete", complete);
    fbbatch.on("error", error);
    fbbatch.on("progress", progress);
    fbbatch.batch(list, callback);
}

// callback function
function callback(err, res) {
    if (err) {
        // console.log("failure:", err);
    } else {
        // console.log("success:", res);
    }
}

// success handler
function complete(res) {
    // console.log("complete:", res.length);

    if (program.csv) {
        var csv = to_csv(res);
        output(csv);
    } else if (program.json || !program.csv) {
        var json = JSON.stringify(res);
        output(json + "\n");
    }
}

// failure handler
function error(err) {
    console.error("error:", err);
    process.exit(1);
}

// progress handler
function progress(info) {
    if (!program.verbose) return;
    console.log("#", info);
}

function output(str) {
    if (program.output) {
        progress("output: " + program.output);
        fs.writeFile(program.output, str, function(err) {
            if (err) error(err);
        });
    } else {
        util.print(str);
    }
}

function to_csv(list) {
    var cols = program.csv.split(/\s*,\s*/);
    progress("Columns: " + cols.join(", ") + " (" + cols.length + ")");
    var table = list.map(function(line) {
        return cols.map(function(col) {
            return line[col]
        });
    });
    table.unshift(cols);
    var out = table.map(function(row) {
        var array = row.map(function(val) {
            if (val == null) val = "";
            val += "";
            if (val.search(/[",\s]/) > -1) {
                val = '"' + val.replace(/"/g, '""') + '"';
            }
            return val;
        });
        return line = array.join(",") + "\n";
    });
    return out.join("");
}
