module.exports = function () {

    function start_fs_jszip(zipfile,cb) {

        var self = {
             ready   : false,
             fs      : null,
             process : null
        };

        function fsLoader(err, data) {
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
        }

        if (typeof window.JSZipUtils!== "undefined" &&
            typeof window.JSZipUtils.getBinaryContent ==="function" &&
            typeof zipfile === "string" &&
            zipfile.endsWith(".zip") ) {

                window.JSZipUtils.getBinaryContent(zipfile,fsLoader);

        } else {
            if (typeof zipfile==="object" && zipfile.constructor===ArrayBuffer) {
                fsLoader(null, zipfile)
            }

        }

        return self;

    }

    return start_fs_jszip;
}
