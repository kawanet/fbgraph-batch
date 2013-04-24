// batch.js

module.exports = FBGraphBatch;

var util = require("util");
var events = require("events");
var qs = require("qs");
var request = require("request");
var MAX_REQ = 50;
var CALLBACK_PREFIX = "callback_";

function FBGraphBatch(opts) {
    if (!(this instanceof FBGraphBatch)) return new FBGraphBatch(opts);
    events.EventEmitter.call(this);
    if (!opts) opts = {};
    this.access_token = opts.access_token;
    this.max_request = opts.max_request || MAX_REQ;
}

util.inherits(FBGraphBatch, events.EventEmitter);

FBGraphBatch.batch = function() {
    var fbbatch = new FBGraphBatch();
    fbbatch.batch.apply(fbbatch, arguments);
};

FBGraphBatch.prototype.batch = function(list, callback) {
    var self = this;

    if (!list) {
        done("empty source list");
    } else if ("string" == typeof list) {
        list = [list];
    } else if (!list.length) {
        done("empty source list");
    }

    var reqcnt = Math.floor(Math.random() * 800000 + 100000);
    var reqcache = {};
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
        var batch = list.map(function(link, num) {
            reqcache["" + reqcnt] = link;
            link = link.replace(/\%/g, "%25");
            link = link.replace(/\?/g, "%3F");
            link = link.replace(/\#/g, "%23");
            var path = link + "?callback=" + CALLBACK_PREFIX + reqcnt;
            reqcnt++;
            var obj = {
                relative_url: path
            };
            return obj;
        });

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
            } else if (res.statusCode != 200) {
                callback(res.statusCode);
            } else {
                parse_json(body, callback);
            }
        });
    }

    function parse_json(json, callback) {
        var body = JSON.parse(json);
        var list = [];
        var errs = [];
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
                callback("empty Facebook API response for an individual sub request");
            } else {
                self.emit("progress", res.code + " " + res.body.substr(0, 150) + (res.body.length > 150 ? "..." : ""));
                var json = res.body;
                var reqid;
                var isjsonp;
                json = json.replace(/^\s*\/\*.*?\*\/\s*/, "");
                json = json.replace(/\s*\/\*.*?\*\/\s*$/, "");
                var regexp = new RegExp("^" + CALLBACK_PREFIX + "(\\d+)\\(");
                json = json.replace(regexp, function(all, num) {
                    reqid = reqcache[num];
                    self.emit("progress", "callback: " + num + " " + reqid);
                    isjsonp = true;
                    return "";
                });
                if (isjsonp) {
                    json = json.replace(/\);?\s*$/, "");
                }
                var body = JSON.parse(json);
                // self.emit("progress", "json: " + JSON.stringify(body));
                if (res.code == 200) {
                    list.push(body);
                    self.emit("item", body, reqid);
                } else {
                    errs.push(body);
                    self.emit("warn", body, reqid);
                }
            }
        });
        self.emit("progress", "total: " + list.length + " / " + body.length);
        if (list.length) {
            callback(null, list);
        } else if (errs.length) {
            callback(JSON.stringify(errs));
        } else {
            callback("No Facebook API batch responses");
        }
    }
};