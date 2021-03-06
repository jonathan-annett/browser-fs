module.exports = function(){

//jshint -W104
//jshint -W119


function fs_JSZip_internal (exports,zipWrap,zip,nodePath,cb) {

    var
    ab2str            = function ab2str(buf) {
      return String.fromCharCode.apply(null, new Uint16Array(buf));
    },
    str2ab            = function str2ab(str) {
      var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
      var bufView = new Uint16Array(buf);
      for (var i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    },
    cwd               = "/";

    zipWrap(zip,nodePath,function(wrapped,totalBytes){

        var
        find_entry_from_path=function find_entry_from_path(path){
            var

            zip_fn = path,
            found  = zip.files[zip_fn];

            if (!found) {
                if (!(found = zip.files[(zip_fn = path+"/")])) {
                    if (!(found = zip.files[(zip_fn = path.substr(1))] )) {
                        if (!(found = zip.files[(zip_fn = zip_fn+"/")])){
                            zip_fn=path;
                            if (zip_fn==="/") {
                                found = {
                                    name : "/",
                                    dir  : true
                                };
                            }
                        }
                    }
                }
            }

            return {
                found  : found,
                zip_fn : zip_fn
            };
        },

        zip_fn_from_path = function zip_fn_from_path(path){return find_entry_from_path(path).zip_fn;},

        zip_resolve=function zip_resolve(path) {
            // 1) resolve true_path (reduce any double slashes to single slashes:
            // "." --> cwd (default "/")
            // "./file.ext" --> cwd/file.ext ( default "/file.ext")
            // "file.text" --> cwd/file.ext  ( default "/file.ext")
            // "/some/other/path/file.ext" --> "/some/other/path/file.ext"
            // "/some///other/path/file.ext" --> "/some/other/path/file.ext"
            // 2) get full file list from zip.files, and fixup any entries that don't have leading /
            // "path/file.ext" --> "/path/file.ext"
            // "file.ext" --> "/file.ext"
            // "/some/other/path/file.ext" --> "/some/other/path/file.ext"
            // 3) lookup true_path in fixed file list, call any match "found"
            // 4) return all this info to caller in standardzed format

            var errpath = path;

            path = wrapped.true_path_from_relative_path(cwd,path);

            var
            dir_basename = path.split("/"),
            basename = dir_basename.pop(),
            dirname  = '/'+dir_basename.filter(function(f){return f.length>0;}).join("/"),
            find     = find_entry_from_path(path);
            return {
                path      : errpath,                     // what user passed in
                true_path : path,                        // force "path/to/sub/file.ext" ---> "/path/to/sub/file.ext"
                zip_fn    : find.zip_fn,                 // what the file is called in the zip
                                                         // (in some cases files won't have leading slash, and may have trailing slash. true_path is normalized, zip_fn is actual fn in the zip)
                basename  : basename,                    // "/path/to/sub"
                dirname   : dirname,                     // "file.ext"
                ext       : basename.split(".").pop(),   // "ext"
                found     : find.found,                  // directory entry (if path exists in zip)
                dir_filter: find.found && find.found.dir ? (path === "/" ? path:path + "/") : undefined,
                error : function(err,code,errno,syscall) {
                    err.code    = code;
                    err.errno   = errno;
                    err.syscall = syscall;
                    err.path    = errpath;
                    return err;
                }
            };

        },


        fs_process = {
            cwd : function getCwd(path) {
                return cwd;
            },
            chdir : function (path) {
                var lookup = zip_resolve(path);
                console.log({lookup});

                if (lookup.found && lookup.found.dir) {
                    cwd=lookup.dir_filter;
                } else {
                    throw lookup.error(
                       new Error ("ENOENT: no such file or directory, chdir '"+path+"'"),
                           'ENOENT',
                           -2,
                           'chdir'
                    );
                }
            }
        },

        fs_constants = {
             UV_FS_SYMLINK_DIR: 1,
             UV_FS_SYMLINK_JUNCTION: 2,
             O_RDONLY: 0,
             O_WRONLY: 1,
             O_RDWR: 2,
             UV_DIRENT_UNKNOWN: 0,
             UV_DIRENT_FILE: 1,
             UV_DIRENT_DIR: 2,
             UV_DIRENT_LINK: 3,
             UV_DIRENT_FIFO: 4,
             UV_DIRENT_SOCKET: 5,
             UV_DIRENT_CHAR: 6,
             UV_DIRENT_BLOCK: 7,
             S_IFMT: 61440,
             S_IFREG: 32768,
             S_IFDIR: 16384,
             S_IFCHR: 8192,
             S_IFBLK: 24576,
             S_IFIFO: 4096,
             S_IFLNK: 40960,
             S_IFSOCK: 49152,
             O_CREAT: 64,
             O_EXCL: 128,
             UV_FS_O_FILEMAP: 0,
             O_NOCTTY: 256,
             O_TRUNC: 512,
             O_APPEND: 1024,
             O_DIRECTORY: 65536,
             O_NOATIME: 262144,
             O_NOFOLLOW: 131072,
             O_SYNC: 1052672,
             O_DSYNC: 4096,
             O_DIRECT: 16384,
             O_NONBLOCK: 2048,
             S_IRWXU: 448,
             S_IRUSR: 256,
             S_IWUSR: 128,
             S_IXUSR: 64,
             S_IRWXG: 56,
             S_IRGRP: 32,
             S_IWGRP: 16,
             S_IXGRP: 8,
             S_IRWXO: 7,
             S_IROTH: 4,
             S_IWOTH: 2,
             S_IXOTH: 1,
             F_OK: 0,
             R_OK: 4,
             W_OK: 2,
             X_OK: 1,
             UV_FS_COPYFILE_EXCL: 1,
             COPYFILE_EXCL: 1,
             UV_FS_COPYFILE_FICLONE: 2,
             COPYFILE_FICLONE: 2,
             UV_FS_COPYFILE_FICLONE_FORCE: 4,
             COPYFILE_FICLONE_FORCE: 4
        },

        getOptionsWithEncodingCallback = function getOptionsWithEncodingCallback(options,callback) {
            function throwOpts(){
                return new Error ( 'The "options" argument must be one of type string or Object. Received type '+typeof options);
            }
            switch (typeof options) {
                case 'function':
                    if (callback===false) {
                        throw throwOpts();
                    }
                    callback = options;
                    options = {
                        callback : callback
                    };
                    break;
                case 'undefined':
                    options = {
                        callback : callback
                    };
                    break;
                case 'string':
                    options = {
                        encoding : options,
                        callback : callback
                    };
                    break;
                case 'object':
                    options.callback = callback;
                    break;
                default:
                    throw throwOpts();
            }

            if (callback!==false && typeof options.callback!=='function') {
               throw new Error ("Callback must be a function. Received "+typeof options.callback);
            }

            options.__zipWrap_opts   = {binary:["utf8","utf-8"].indexOf(options.encoding)<0};
            options.__zipWrap_method = options.__zipWrap_opts.binary?"arraybuffer":"string";

            return options;
        },
        getPromiserForOptionsWithEncodingCallback = function getPromiserForOptionsWithEncodingCallback (requester) {
            var promiser = function (path, options) {
                return new Promise(function(resolve,reject){
                      options = getOptionsWithCallback(options,function(err,result){
                            if (err) return reject(err);
                            return resolve(result);
                      });
                      setTimeout(requester,0,path,options,options.callback);
                });
            };
            promiser.name=requester.name;
            return promiser;
        },
        getOptionsWithCallback = function getOptionsWithCallback(options,callback) {
            function throwOpts(){
                return new Error ( 'The "options" argument must be one of type string or Object. Received type '+typeof options);
            }
            switch (typeof options) {
                case 'function':
                    if (callback===false) {
                        throw throwOpts();
                    }
                    callback = options;
                    options = {
                        callback : callback
                    };
                    break;
                case 'undefined':
                    options = {
                        callback : callback
                    };
                    break;
                case 'object':
                    options.callback = callback;
                    break;
                default:
                    throw throwOpts();
            }

            if (callback!==false && typeof options.callback!=='function') {
               throw new Error ( "Callback must be a function. Received "+typeof options.callback);
            }

            return options;
        },
        getPromiserForOptionsWithCallback = function getPromiserForOptionsWithCallback (requester) {
            var promiser = function (path, options) {
                return new Promise(function(resolve,reject){
                      options = getOptionsWithCallback(options,function(err,result){
                            if (err) return reject(err);
                            return resolve(result);
                      });
                      setTimeout(requester,0,path,options,options.callback);
                });
            };
            promiser.name=requester.name;
            return promiser;
        },
        getFlagsWithCallback = function getFlagsWithCallback(flags,callback) {
            function throwOpts(){
                return new Error ( 'The "flags" argument must be number. Received type '+typeof options);
            }
            var options = {
                callback : callback
            };
            switch (typeof flags) {
                case 'function':
                    if (callback===false) {
                        throw throwOpts();
                    }
                    callback = flags;
                    options.callback = callback;
                    break;
                case 'number':
                    options.COPYFILE_EXCL = (flags & fs_constants.COPYFILE_EXCL)!==0;
                    break;
                default:
                    throw throwOpts();
            }

            if (callback!==false && typeof options.callback!=='function') {
               throw new Error (
                       "Callback must be a function. Received "+typeof options.callback);
            }

            return options;
        },
        getPromiserForCopyFile = function getPromiserForCopyFile (requester) {
            var promiser = function (src,dest,flags) {
                return new Promise(function(resolve,reject){
                      var options = getFlagsWithCallback(flags,function(err,result){
                            if (err) return reject(err);
                            return resolve(result);
                      });
                      setTimeout(requester,0,src,dest,flags,options.callback);
                });
            };
            promiser.name=requester.name;
            return promiser;
        },
        getPromiserForRename = function getPromiserForRename (requester) {
            var promiser = function (oldName,newName) {
                return new Promise(function(resolve,reject){
                      setTimeout(requester,0,oldName,newName,function(err,result){
                        if (err) return reject(err);
                        return resolve(result);
                      });
                });
            };
            promiser.name=requester.name;
            return promiser;
        },
        getPromiserForCallback =function getPromiserForCallback (requester) {
            var promiser = function (path) {
                return new Promise(function(resolve,reject){
                      setTimeout(requester,0,path,function(err,result){
                        if (err) return reject(err);
                        return resolve(result);
                      });
                });
            };
            promiser.name=requester.name;
            return promiser;
        },


        readdir           = function readdir(path, options, callback) {
            if (typeof options==='function') {
                callback=options;
                options={};
            }
            try {
                setTimeout(callback,0,null,wrapped.view_dir(path).get_listing(options&&options.recursive));
            } catch (err) {
                return callback(err);
            }
        },
        readdirSync       = function readdirSync(path,options){
            return wrapped.view_dir(path).get_listing( options && options.recursive );
        },

        readFile          = function readFile(path, options, callback) {
            options = getOptionsWithEncodingCallback(options,callback);
            wrapped[ options.__zipWrap_method ][path](options.callback);
        },
        readFileSync      = function readFileSync(path, options){
            options = getOptionsWithEncodingCallback(options,false);
            return wrapped[ options.__zipWrap_method ][path]();
        },

        writeFile         = function writeFile(path, data, options, callback) {
            options = getOptionsWithEncodingCallback(options,callback);
            wrapped[ options.__zipWrap_method ] = data;
            setTimeout(options.callback,0,null);
        },
        writeFileSync     = function writeFileSync(path, data, options) {
            options = getOptionsWithEncodingCallback(options,false);
            wrapped[ options.__zipWrap_method ] = data;
        },

        mkdir             = function mkdir(path, options, callback){
            options = getOptionsWithCallback(options,callback);

            if (options.recursive) {
                wrapped.mkdirp(path,options.callback);
            } else {
                wrapped.mkdir(path,options.callback);
            }
        },
        mkdirSync         = function mkdirSync(path, options) {
            options = getOptionsWithCallback(options,false);

            if (options.recursive) {
                wrapped.mkdirp(path);
            } else {
                wrapped.mkdir(path);
            }
        },
        exists            = function exists(path, callback) {
             return wrapped.exists(path,callback );
        },
        existsSync        = function exists(path) {
            return wrapped.exists(path);
        },

        rmdir             = function rmdir(path, options, callback) {
            options = getOptionsWithCallback(options,callback);

            if (options.recursive) {
                wrapped.rm(path,options.callback);
            } else {
                wrapped.rmdir(path,options.callback);
            }
        },
        rmdirSync         = function rmdir(path, options) {
            options = getOptionsWithCallback(options,false);
            if (options.recursive) {
                wrapped.rm(path);
            } else {
                wrapped.rmdir(path);
            }
        },
        unlink            = function unlink(path, callback) {
            wrapped.rm(path,callback);
        },
        unlinkSync        = function unlinkSync(path) {
           wrapped.rm(path);
        },
        stat              = function stat(path, options, callback) {
            options = getOptionsWithCallback(options,callback);
            return  wrapped.stat(path,options.callback);
        },
        statSync          = function stat(path, options) {
            options = getOptionsWithCallback(options,false);
            return  wrapped.stat(path);
        },
        appendFile        = function appendFile(path, data, options, callback){

            options = getOptionsWithEncodingCallback(options,callback);
            wrapped.string[path](
                function (err,existingData) {
                    if (err) return options.callback(err);
                    if (options.__zipWrap_method!=="string") {
                        data = ab2str(data);
                    }
                    wrapped.string[path] = existingData + data;
                    options.callback();
                }
            );

        },
        appendFileSync    = function appendFileSync(path, data, options) {
            options = getOptionsWithEncodingCallback(options,false);
            if (options.__zipWrap_method!=="string") {
                data = ab2str(data);
            }
            wrapped.string[path] = wrapped.string[path]() + data;
        },
        rename            = function rename(oldPath, newPath, callback) {
            return wrapped.mv(oldPath,newPath,callback);
        },
        renameSync        = function renameSync(oldPath, newPath) {
            return wrapped.mv(oldPath,newPath);
        },
        copyFile            = function copyFile(src, dest, flags, callback) {
            var options = getFlagsWithCallback(flags,callback);
            if (options.COPYFILE_EXCL && wrapped.exists(dest)) {
                return options.callback(new Error(dest+" exists (options.COPYFILE_EXCL set)"));
            }
            return wrapped.cp(src,dest,options.callback);
        },
        copyFileSync        = function copyFileSync(src, dest, flags ) {
            var options = getFlagsWithCallback(flags,false);
            if (options.COPYFILE_EXCL && wrapped.exists(dest)) {
                throw new Error(dest+" exists (options.COPYFILE_EXCL set)");
            }
            return wrapped.cp(src,dest);
        },
        watching          = {},
        watch             = function watch(filename, options, listener) {
            return wrapped.addWatcher(filename, options, function(a,b) {
                listener(a,b);
            });
        },
        watchFile         = function watchFile(filename, options, listener) {
            if (typeof options === 'function') {
                listener = options;
                options = {
                    interval : 5007
                };
            }
            watchFile.watchers = watchFile.watchers || {};
            var watchers = watchFile.watchers[filename]||[];
            watchFile.watchers[filename]=watchers;

            wrapped.stat(filename,function(err,firstStat) {

                var prev= firstStat;
                listener.watcher = wrapped.addWatcher(filename, options, function(a,b,curr){
                    listener(curr,prev);
                    prev=curr;
                });

                watchers.push(listener);

            });
        },
        unwatchFile       = function unwatchFile(filename, listener) {
            if (watchFile.watchers) {
                var watchers = watchFile.watchers[filename];
                if (watchers) {
                    if (listener){
                        if (listener.watcher) {
                            listener.watcher.close();
                            delete listener.watcher;
                        }
                        var index = watchers.indexOf(listener);
                        if (index>=0) watchers.splice(index,1);
                        if (watchers.length===0) {
                            delete watchFile.watchers[filename];
                        }
                    } else {
                        // remove all listeners
                        while (watchers.length>0) {
                            var list = watchers.shift();
                            if (list.watcher) {
                                list.watcher.close();
                                delete list.watcher;
                            }
                        }
                        delete watchFile.watchers[filename];
                    }
                }
            }
        },


        fs = {
    /*impl*/"appendFile": {
                "value": appendFile,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"appendFileSync": {
                "value": appendFileSync,
                "configurable": true,
                "enumerable": true
            },
            "access": {
                "value": function access(path, mode, callback) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "accessSync": {
                "value": function accessSync(path, mode) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "chown": {
                "value": function chown(path, uid, gid, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "chownSync": {
                "value": function chownSync(path, uid, gid) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "chmod": {
                "value": function chmod(path, mode, callback) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "chmodSync": {
                "value": function chmodSync(path, mode) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "close": {
                "value": function close(fd, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "closeSync": {
                "value": function closeSync(fd) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"copyFile": {
                "value": copyFile,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"copyFileSync": {
                "value": copyFileSync,
                "configurable": true,
                "enumerable": true
            },
            "createReadStream": {
                "value": function createReadStream(path, options) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "createWriteStream": {
                "value": function createWriteStream(path, options) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"exists": {
                "value": exists,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"existsSync": {
                "value": existsSync,
                "configurable": true,
                "enumerable": true
            },
            "fchown": {
                "value": function fchown(fd, uid, gid, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fchownSync": {
                "value": function fchownSync(fd, uid, gid) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fchmod": {
                "value": function fchmod(fd, mode, callback) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fchmodSync": {
                "value": function fchmodSync(fd, mode) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fdatasync": {
                "value": function fdatasync(fd, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fdatasyncSync": {
                "value": function fdatasyncSync(fd) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fstat": {
                "value": function fstat(fd, options, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fstatSync": {
                "value": function fstatSync(fd, options = {}) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fsync": {
                "value": function fsync(fd, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "fsyncSync": {
                "value": function fsyncSync(fd) {
                    throw new Error ("not implemented");
                 },
                "configurable": true,
                "enumerable": true
            },
            "ftruncate": {
                "value": function ftruncate(fd, len, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "ftruncateSync": {
                "value": function ftruncateSync(fd, len = 0) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "futimes": {
                "value": function futimes(fd, atime, mtime, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "futimesSync": {
                "value": function futimesSync(fd, atime, mtime) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "lchown": {
                "value": function lchown(path, uid, gid, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "lchownSync": {
                "value": function lchownSync(path, uid, gid) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "link": {
                "value": function link(existingPath, newPath, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "linkSync": {
                "value": function linkSync(existingPath, newPath) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "lstat": {
                "value": function lstat(path, options, callback) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "lstatSync": {
                "value": function lstatSync(path, options = {}) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"mkdir": {
                "value": mkdir,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"mkdirSync": {
                "value": mkdirSync,
                "configurable": true,
                "enumerable": true
            },
            "mkdtemp": {
                "value": function mkdtemp(prefix, options, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "mkdtempSync": {
                "value": function mkdtempSync(prefix, options) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "open": {
                "value": function open(path, flags, mode, callback) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "openSync": {
                "value": function openSync(path, flags, mode) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "opendir": {
                "value": function opendir(path, options, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "opendirSync": {
                "value": function opendirSync(path, options) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"readdir": {
                "value": readdir,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"readdirSync": {
                "value": readdirSync,
                "configurable": true,
                "enumerable": true
            },
            "read": {
                "value": function read(fd, buffer, offset, length, position, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "readSync": {
                "value": function readSync(fd, buffer, offset, length, position) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"readFile": {
                "value": readFile,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"readFileSync": {
                "value": readFileSync,
                "configurable": true,
                "enumerable": true
            },
            "readlink": {
                "value": function readlink(path, options, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "readlinkSync": {
                "value": function readlinkSync(path, options) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "realpath": {
                "value": function realpath(p, options, callback) {
                    throw new Error ("not implemented");
                 },
                "configurable": true,
                "enumerable": true
            },
            "realpathSync": {
                "value": function realpathSync(p, options) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "rename": {
                "value": rename,
                "configurable": true,
                "enumerable": true
            },
            "renameSync": {
                "value": renameSync,
                "configurable": true,
                "enumerable": true
            },
            "rmdir": {
                "value": rmdir,
                "configurable": true,
                "enumerable": true
            },
            "rmdirSync": {
                "value": rmdirSync,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"stat": {
                "value": stat,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"statSync": {
                "value": statSync,
                "configurable": true,
                "enumerable": true
            },
            "symlink": {
                "value": function symlink(target, path, type_, callback_) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "symlinkSync": {
                "value": function symlinkSync(target, path, type) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "truncate": {
                "value": function truncate(path, len, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "truncateSync": {
                "value": function truncateSync(path, len) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"unwatchFile": {
                "value": unwatchFile,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"unlink": {
                "value": unlink,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"unlinkSync": {
                "value": unlinkSync,
                "configurable": true,
                "enumerable": true
            },
            "utimes": {
                "value": function utimes(path, atime, mtime, callback) {
                    throw new Error ("not implemented");
            },
                "configurable": true,
                "enumerable": true
            },
            "utimesSync": {
                "value": function utimesSync(path, atime, mtime) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "watch": {
                "value": watch,
                "configurable": true,
                "enumerable": true
            },
            "watchFile": {
                "value": watchFile,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"writeFile": {
                "value": writeFile,
                "configurable": true,
                "enumerable": true
            },
    /*impl*/"writeFileSync": {
                "value": writeFileSync,
                "configurable": true,
                "enumerable": true
            },
            "write": {
                "value": function write(fd, buffer, offset, length, position, callback) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "writeSync": {
                "value": function writeSync(fd, buffer, offset, length, position) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "writev": {
                "value": function writev(fd, buffers, position, callback) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "writevSync": {
                "value": function writevSync(fd, buffers, position) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "Dir": {
                "value": function Dir(handle, path, options) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "Dirent": {
                "value": function Dirent(name, type) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "Stats": {
                "value": function Stats(dev, mode, nlink, uid, gid, rdev, blksize,
                       ino, size, blocks,
                       atimeMs, mtimeMs, ctimeMs, birthtimeMs) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "ReadStream": {
                "value": function ReadStream(path, options) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "WriteStream": {
                "value": function WriteStream(path, options) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "FileReadStream": {
                "value": function FileReadStream(path, options) {
                   throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "FileWriteStream": {
                "value": function FileWriteStream(path, options) {
                    throw new Error ("not implemented");
                },
                "configurable": true,
                "enumerable": true
            },
            "_toUnixTimestamp": {
                "value": function _toUnixTimestamp(time, name = 'time') {
                    throw new Error ("not implemented");
            },
                "configurable": true,
                "enumerable": true
            },
            "promises": {
                "access": {
                    "value": function access(path, mode ) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "copyFile": {
                    "value": getPromiserForCopyFile (copyFile),
                    "configurable": true,
                    "enumerable": true
                },
                "open": {
                    "value": function open(path, flags, mode) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "opendir": {
                    "value": function opendir(...args) {
                            throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "rename": {
                    "value": getPromiserForRename(rename),
                    "configurable": true,
                    "enumerable": true
                },
                "truncate": {
                    "value": function truncate(path, len = 0) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "rmdir": {
                    "value": getPromiserForOptionsWithCallback(rmdir),
                    "configurable": true,
                    "enumerable": true
                },
                "mkdir": {
                    "value": getPromiserForOptionsWithCallback(mkdir),
                    "configurable": true,
                    "enumerable": true
                },
                "readdir": {
                    "value": getPromiserForOptionsWithCallback(readdir),
                    "configurable": true,
                    "enumerable": true
                },
                "readlink": {
                    "value": function readlink(path, options) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "symlink": {
                    "value": function symlink(target, path, type_) {
                        throw new Error ("not implemented");
                },
                    "configurable": true,
                    "enumerable": true
                },
                "lstat": {
                    "value": function lstat(path, options = { bigint: false }) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "stat": {
                    "value": getPromiserForOptionsWithCallback(stat),
                    "configurable": true,
                    "enumerable": true
                },
                "link": {
                    "value": function link(existingPath, newPath) {
                       throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "unlink": {
                    "value": getPromiserForCallback(unlink),
                    "configurable": true,
                    "enumerable": true
                },
                "chmod": {
                    "value": function chmod(path, mode) {
                           throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "lchmod": {
                    "value": function lchmod(path, mode) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "lchown": {
                    "value": function lchown(path, uid, gid) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "chown": {
                    "value": function chown(path, uid, gid) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "utimes": {
                    "value": function utimes(path, atime, mtime) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "realpath": {
                    "value": function realpath(path, options) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "mkdtemp": {
                    "value": function mkdtemp(prefix, options) {
                            throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "writeFile": {
                    "value": getPromiserForOptionsWithEncodingCallback(readFile),
                    "configurable": true,
                    "enumerable": true
                },
                "appendFile": {
                    "value": function appendFile(path, data, options) {
                        throw new Error ("not implemented");
                    },
                    "configurable": true,
                    "enumerable": true
                },
                "readFile": {
                    "value": getPromiserForOptionsWithEncodingCallback(readFile),
                    "configurable": true,
                    "enumerable": true
                }
            }
        };

        cb({fs:Object.defineProperties({},fs),process:fs_process,wrapped:wrapped});

    });


}

function fs_JSZip (exports,data,zipWrap,JSZip,nodePath,cb) {

    if (!(typeof JSZip!=='undefined' && typeof JSZip.loadAsync === 'function' ) ) return;

    JSZip.loadAsync(data).then(function (zip) {
        fs_JSZip_internal (exports,zipWrap,zip,nodePath,cb);
    }).catch(function(e){ throw(e);});


}

fs_JSZip.internal = fs_JSZip_internal;

return fs_JSZip;


}
