var profile = (function () {
    var testResourceRe = /^imagediscovery\/tests\//,
        copyOnly = function (filename, mid) {
            var list = {
                "imagediscovery/package.json":1,
                "imagediscovery/imagediscovery.profile.js":1
            };

            return (mid in list);
        };
    return {
        resourceTags:{
            test:function (filename, mid) {
                return testResourceRe.test(mid) || mid=="app/tests";
            },
            copyOnly:function (filename, mid) {
                return copyOnly(filename, mid);
            },
            amd:function (filename, mid) {
                return !testResourceRe.test(mid)
                   && !copyOnly(filename, mid)
                   && /\.js$/.test(filename);
            }
        }
    };
})();
