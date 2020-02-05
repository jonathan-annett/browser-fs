module.exports = function () {

    function start_fs_jszip(zipfile,cb) {

        var self = {
             ready   : false,
             fs      : null,
             process : null
        };

        function onModLoad(mod){
            self.fs=mod.fs;
            self.process=mod.process;
            self.ready=true;
            cb(null,self.fs,self.process);
        }


        function fsLoader(err, data) {
            if (err) return cb(err);

            window.fsJSZip(
                self,
                data,
                window.zipFsWrap,
                window.JSZip,
                window.simRequire.path,
                onModLoad
            );
        }

        function fsInternalLoader(zip) {

            window.fsJSZip.internal(
                self,
                window.zipFsWrap,
                zip,
                window.simRequire.path,
                onModLoad
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
            } else {

                if (typeof zipfile==="object" &&
                    typeof zipfile.files === "object" &&
                    typeof zipfile.file === "function" ) {
                    fsInternalLoader(zipfile);
                }
            }

        }

        return self;

    }

    return start_fs_jszip;
}
