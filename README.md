# fbgraph-batch

Facebook Graph API Batch Request Client

## Usage

This package provides both interfaces of CLI and JavaScript API.

## CLI

```
    $ npm install -g fbgraph-batch

    $ fbgraph-batch -h

    Usage: fbgraph-batch [options] <ID ...>

    Options:

      -h, --help           output usage information
      -V, --version        output the version number
      -j, --json           output as JSON (default)
      -c, --csv <columns>  output CSV with specified columns
      -i, --input <file>   input URL list from file
      -o, --output <file>  write results to file
      -t, --token <token>  $FACEBOOK_ACCESS_TOKEN (required)
      -v, --verbose        show verbose messages

    $ export FACEBOOK_ACCESS_TOKEN='123456789012345|ABCDEFGHIJKLMNOPQRSTUVWXYZa'

    $ fbgraph-batch --csv "id,name,link" 4 731850967
    id,name,link
    4,"Mark Zuckerberg",http://www.facebook.com/zuck
    731850967,"Yusuke Kawasaki",http://www.facebook.com/kawanet

    $ fbgraph-batch --json http://www.yahoo.co.jp/ http://www.yahoo.com/
    [{"id":"http://www.yahoo.co.jp","shares":52058,"comments":27},{"id":"http://www.yahoo.com","shares":1057750,"comments":1}]
```

## JavaScript API

### Installation

```sh
    npm install fbgraph-batch
```

### Callback Style

```javascript
    var FBGraphBatch = require("fbgraph-batch");

    var opts = {access_token: "123456789012345|ABCDEFGHIJKLMNOPQRSTUVWXYZa"};
    var queries = ['4', '731850967'];

    FBGraphBatch(opts).batch(queries, function(err, list) {
        if (err) {
            console.error(err);
        } else {
            console.log(list);
        }
    });
```

### Event Style

```javascript
    var FBGraphBatch = require("fbgraph-batch");

    var opts = {access_token: "123456789012345|ABCDEFGHIJKLMNOPQRSTUVWXYZa"};
    var queries = ['http://www.yahoo.co.jp/', 'http://www.yahoo.com/'];

    new FBGraphBatch(opts)
    .on("complete", function(list) {
        console.log(list);
    })
    .on("error", function(err) {
        console.error(err);
    })
    .on("progress", function(info) {
        console.log(info);
    })
    .batch(queries);
```

## Author

@kawanet

## Licence

Copyright 2013 @kawanet

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
