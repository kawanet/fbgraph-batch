// batch.js

module.exports = FBGraphBatch;

var util = require("util");
var events = require("events");
var qs = require("qs");
var request = require("request");
var MAX_REQ = 50;

function FBGraphBatch(opts) {
    events.EventEmitter.call(this);
    if (!opts) opts = {};
    this.access_token = opts.access_token;
    this.max_request = opts.max_request || MAX_REQ;
}

util.inherits(FBGraphBatch, events.EventEmitter);

FBGraphBatch.prototype.batch = function(list, callback) {
    var self = this;

    if (!list) {
        done("empty source list");
    } else if ("string" == typeof list) {
        list = [list];
    } else if (!list.length) {
        done("empty source list");
    }

    var source = list.concat([]); // copy
    var buf = [];
    nextreq(end);

    function end(err, res) {
        if (err) {
            if ("string" == typeof err) err = new Error(err);
            self.emit("error", err);
        } else {
            self.emit("complete", res);
        }
        if (callback) {
            callback.apply(null, arguments);
        }
    }

    function nextreq(callback) {
        var sublist = source.splice(0, self.max_request);
        makereq(sublist, function(err, res) {
            if (err) {
                callback(err);
            } else {
                buf = buf.concat(res);
                if (source.length) {
                    nextreq(callback);
                } else {
                    callback(null, buf); // done
                }
            }
        });
    }

    function makereq(list, callback) {
        var batch = list.map(function(link) {return {relative_url: link};});

        var param = {};
        param.access_token = self.access_token;
        param.batch = JSON.stringify(batch);

        var opts = {};
        opts.url = "https://graph.facebook.com/";
        opts.body = qs.stringify(param);
        self.emit("progress", "endpoint: " + opts.url);

        request.post(opts, function(err, res, body) {
            if (err) {
                callback(err);
            } else {
                parse_json(body, callback);
            }
        });
    }

    function parse_json(json, callback) {
        var body = JSON.parse(json);
        var list = [];
        if (!(body instanceof Array)) {
            if ("object" == typeof body && body.error) {
                callback(body.error);
            } else {
                callback(body);
            }
            return;
        }
        body.forEach(function(res) {
            if (!res || !res.body) {
                callback("empty Facebook API response");
            } else {
                var body = JSON.parse(res.body);
                list.push(body);
                self.emit("progress", res.code + " " + res.body.substr(0, 64) + (res.body.length > 64 ? "..." : ""));
            }
        });
        self.emit("progress", "total: " + list.length);
        if (list.length == 0) {
            callback("zero Facebook API responses");
        } else {
            callback(null, list);
        }
    }
};

