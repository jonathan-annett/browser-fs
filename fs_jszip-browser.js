module.exports = function () {

    function start_fs_jszip(url,cb) {

        var self = {
             ready   : false,
             fs      : null,
             process : null
        };

        window.JSZipUtils.getBinaryContent(url, function(err, data) {
            if (err) return cb(err);

            window.fsJSZip(
                self,
                data,
                window.zipFsWrap,
                window.JSZip,
                window.simRequire.path,
                function(mod){
                    self.fs=mod.fs;
                    self.process=mod.process;
                    self.ready=true;
                    cb(null,self.fs,self.process);
                }
            );
        });

        return self;

    }

    return start_fs_jszip;
}
