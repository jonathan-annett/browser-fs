(function($N){

/*/home/jonathanmaxannett/browser-fs/fs_jszip-browser.js*/
$N[0][$N[1]]=(function($N){
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
})(!$N[0].Document);

})(typeof process+typeof module+typeof require==='objectobjectfunction'?[module,'exports']:[window,'start_fs']);
