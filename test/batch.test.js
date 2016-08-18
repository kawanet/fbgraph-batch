// batch.test.js

var expect = require('chai').expect;
var FBGraphBatch = require("../lib/batch");

describe('FBGraphBatch', function() {

    var access_token = process.env.FACEBOOK_ACCESS_TOKEN;
    var describe_with_access_token = access_token ? describe : describe.skip;
    var ok_id = "http://www.yahoo.co.jp";
    var debug = function() {}; // console.log;
    var wait = 500; // wait 0.5 sec

    describe_with_access_token('#batch', function() {
        var graph;

        beforeEach(function() {
            graph = new FBGraphBatch({
                access_token: access_token
            });
        });

        it('emit "complete" with result on success', function(done) {
            graph.on("complete", function(res) {
                debug("complete", res);
                expect(res).to.not.be.empty;
                expect(res[0]).to.have.property('id', ok_id);
                // response format changed
                expect(res[0].share).to.have.property('share_count').and.be.a.number;
                expect(res[0].share).to.have.property('comment_count').and.be.a.number;
                setTimeout(done, wait);
            });
            graph.batch([ok_id]);
        });

        it('emit "error" on error', function(done) {
            graph.access_token = 'xxx';
            graph.on("error", function(err) {
                debug("error", err);
                setTimeout(done, wait);
            });
            graph.batch([ok_id]);
        });

        it('emit "progress" on progress', function(done) {
            var info_list = [];
            graph.on("progress", function(info) {
                debug("progress", info);
                info_list.push(info);
            });
            graph.on("complete", function() {
                expect(info_list).to.not.be.empty;
                done();
            });
            graph.batch([ok_id]);
        });
    });
});
