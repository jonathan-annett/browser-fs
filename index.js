module.exports  = {
    ready   : false,
    fs      : null,
    process : null,

    start    : start,
    selfTest : selfTest,


    browser_path     : __dirname + "/browser-fs.pkg.js",
    browser_min_path : __dirname + "/browser-fs.min.js",

};

var defProp = Object.defineProperties.bind(this,module.exports);
var ECProp = function (x,v){
    var p = {};
    p[x]={enumerable:true,configurable:true};
    switch (typeof v) {
        case 'undefined':break;
        case 'function' : p[x][v.name]=v;break;
        default : p[x].value = v;
    }
    return p;
};

function makeSourceSwizzler(browser) {
    var prop_name = browser+"_src";
    var file_name_prop = browser+"_path";
    var cached ;

    // once we have a valid cache, respond (optionally via callback with data)
    var cachedProp =  ECProp( prop_name,
                              function get(cb) {
                                  return typeof cb==='function' ? cb(cached) : cached;
                              }
                      );

    // first time the getter is accessed (or after a call to clear), we attempt to read the
    // file from disk. read mode is based on presence of a callback
    var swizzlerProp = ECProp(
           prop_name,
           function get(cb) {

               if (typeof cb==='function') {
                   fs.readFile( module.exports[ file_name_prop ],"utf8", function(err,text){
                       if (err) return cb(err);
                       // since there was no error, assume the text is valid to cache
                       cached = text;
                       // swizzle out this function in favour of the cached version
                       delete module.exports[prop_name];
                       defProp(cachedProp );
                       // and return freshly read cache to caller via callback
                       return cb (undefined,cached);
                   });
               } else {
                   cached = fs.readFileSync( module.exports[ file_name_prop ],"utf8");
                   // if we get this far, and have not thrown, the cache will be updated.

                   // swizzle out this function in favour of the cached version
                   delete module.exports[prop_name];
                   defProp(cachedProp );
                   // and return freshly read cache to caller via return
                   return cached;
               }
           }
    );

    if (module.exports[prop_name]) {
        delete module.exports[prop_name];
    }

    defProp(swizzlerProp);

    return {
        clear : function () {
            cached = null;
            delete module.exports[prop_name];
            defProp(swizzlerProp);
        }
    }
}


makeSourceSwizzler("browser");
makeSourceSwizzler("browser_min");

var

fs          = require("fs"),
path        = require("path"),
jszipFsWrap = require("jszip-fs-wrap"),
fs_JSZip    = require("./fs_jszip.js")();

function start(data,cb) {
    return fs_JSZip (
        exports,
        data,
        jszipFsWrap.zipWrap,
        require("jszip"),
        require("path"),
        function(mod){
            module.exports.process = mod.process;
            module.exports.fs = mod.fs;
            module.exports.ready = true;
            return cb ? cb(mod.fs,mod.process) : undefined;
        }
    );
}

start.file = function startWithFile(file,cb) {
    require("fs").readFile(file, function(err, data) {
        if (err) throw err;
        return start(data,cb)
    });
}

function selfTest (cb) {

    start.file("./jszip_test.zip",tests);

    function tests (fs,process) {


        test_mkdir(function(){
            console.log("test_mkdir passes");
            test_mkdirSync();
            console.log("test_mkdirSync passes");
            test_exists(function(){
                console.log("test_exists passes");
                test_existsSync();
                console.log("test_existsSync passes");
                test_rmdir(function(){
                    console.log("test_rmdir passes");

                    test_readFile(function(){
                        console.log("test_readFile passes");
                        test_writeFile(function(){
                            console.log("test_writeFile passes");

                            test_readdir(function(){
                                console.log("test_readdir passes");

                                cb();

                            });
                        });
                    });

                });
            });
        });

        try {
            fs.readFileSync("/jszip_test/hello-world.txt","utf8");
        } catch (e) {
            console.log(e.message);
        }



        function test_mkdirSync() {
            fs.mkdirSync ("newdir");
            fs.mkdirSync ("newdir/more/paths/here",{recursive:true});
            var erred;
            try {
                fs.mkdirSync ("badroot/more/paths/here");
                erred=new Error("non recursive deep shoukd have failed");
            } catch (e) {

            }
            if (erred) {
                throw erred;
            }

            try {
                fs.mkdirSync ("newdir");
                erred=new Error("already exist should have failed");
            } catch (e) {

            }
            if (erred) {
                throw erred;
            }

            try {
                fs.mkdirSync ("/");
                erred=new Error("/ should have failed");
            } catch (e) {

            }
            if (erred) {
                throw erred;
            }

        }

        function test_mkdir(cb) {

            fs.mkdir("newdir2",function(err){
                if (err) {
                    throw err;
                }
                 fs.mkdir("newdir2",function(err){
                    if (!err) {
                       throw new Error("already exist should have failed");
                    }
                    fs.mkdir ("newdir2/more/paths/here",{recursive:true},function(err){
                        if (err) {
                            throw err;
                        }

                        fs.mkdir ("badroot/more/paths/here",function(err){
                             if (!err) {
                                throw new Error("non recursive deep shoukd have failed");
                             }
                             setTimeout(cb,1);
                        });
                    });

                });
            });

        }

        function test_exists(cb) {
            fs.exists("thisshouldnotexist",function(EXISTS){
                if (EXISTS) {
                    throw new Error ("file should not exist");
                }

                fs.exists(".",function(EXISTS){


                  if (!EXISTS) {
                        throw new Error ("file . should exist");
                    }


                   fs.exists("/",function(EXISTS){
                       if (!EXISTS) {
                           throw new Error ("file / should exist");
                       }

                       fs.exists("newdir",function(EXISTS){
                           if (!EXISTS) {
                               throw new Error ("file newdir should exist");
                           }

                           fs.exists("newdir2/more/paths/here",function(EXISTS){
                               if (!EXISTS) {
                                   throw new Error ("file newdir2/more/paths/here should exist");
                               }
                               fs.exists("badroot/more/paths/here",function(EXISTS){
                                   if (EXISTS) {
                                       throw new Error ("file badroot/more/paths/here should not exist");
                                   }

                                   setTimeout(cb,1);
                               });
                           });
                       });
                   });

                });
            });
        }

        function test_existsSync() {


            if (fs.existsSync("thisshouldnotexist")) {
                    throw new Error ("file should not exist");
                }

            if (!fs.existsSync(".")){
                throw new Error ("file . should exist");
            }


            if (!fs.existsSync("/")){
               throw new Error ("file / should exist");
            }

            if (!fs.existsSync("newdir")){
                   throw new Error ("file newdir should exist");
            }

            if (!fs.existsSync("newdir2/more/paths/here")){
                throw new Error ("file newdir2/more/paths/here should exist");
            }
            if (fs.existsSync("badroot/more/paths/here")){
                throw new Error ("file badroot/more/paths/here should not exist");
            }
        }

        function test_rmdir(cb) {

            fs.rmdir("this-path-should-not-exist",function(err){
                if (!err) {
                    throw new Error("rmdir on non existant path shoud fail");
                }
                fs.rmdir("newdir",function(err){
                    if (!err) {
                        throw new Error("rmdir on non empty path should fail");
                    }


                    fs.rmdir("newdir2/more/paths/here",function(err){
                        if (!err) {
                            throw new Error("rmdir on deep path - non recursive should have failed");
                        }

                        fs.rmdir("newdir2/more/paths",{recursive:true},function(err){
                            if (err) {
                                throw new Error("recursive rmdir failed");
                            }


                            setTimeout(cb,1);


                        });


                    });


                });

            });


        }

        function test_readFile(cb){
            fs.readFile("jszip_test/hello-world.txt","utf8",function(err,data){
                if (err) throw err;
                if (data.trim()!=="hello world") throw "readFile test 1 failed";

                fs.readFile("./jszip_test/hello-world.txt","utf8",function(err,data){
                    if (err) throw err;

                    if (data.trim()!=="hello world") throw "readFile test 2 failed";

                    fs.readFile("jszip_test/hello-world.txt","utf-8",function(err,data){
                        if (err) throw err;

                        if (data.trim()!=="hello world") throw "readFile test 3 failed";

                        fs.readFile("./jszip_test/hello-world.txt","utf-8",function(err,data){
                            if (err) throw err;

                            if (data.trim()!=="hello world") throw "readFile test 4 failed";

                            fs.readFile("/jszip_test/hello-world.txt","utf8",function(err,data){
                                if (err) throw err;

                                if (data.trim()!=="hello world") throw "readFile test 5 failed";

                                fs.readFile("/jszip_test/hello-world.txt","utf-8",function(err,data){
                                    if (err) throw err;

                                    if (data.trim()!=="hello world") throw "readFile test 6 failed";

                                    fs.readFile("jszip_test/subdir/under/the/main/directory/harry_potter.txt","utf-8",function(err,data){
                                        if (err) throw err;

                                        if (data.trim()!=="ok it should be under the stairs.") throw "readFile test 7 failed";

                                        setTimeout(cb,1);

                                    });

                                });

                            });

                        });

                    });


                });

            });
        }

        function test_writeFile(cb) {

            console.log(fs.readdirSync("/"));


            fs.writeFile("test.txt","utf8","yeah",function(err){
                if (err) throw err;

                console.log(fs.readdirSync("/"));
                cb(err);

            });
        }

        function test_readdir(cb){

            fs.readdir("nosuchpathforthis",function(err,dir){
                if (!err || dir) {
                    throw new Error ("readdir on non existant path fails");
                }

                fs.readdir("/",function (err,root_dir){
                    if (err) throw err;
                    if (typeof root_dir!=='object' || root_dir.constructor !==Array) {
                        throw new Error ("expected Array from readdir /");
                    }

                    fs.readdir(".",function (err,dot_dir){
                        if (err) throw err;
                        if (typeof dot_dir!=='object' || dot_dir.constructor !==Array) {
                            throw new Error ("expected Array from readdir .");
                        }

                        if (dot_dir.join(",")!== root_dir.join(",")) {
                            throw new Error("readdir / differs from readdir .");
                        }

                        cb();
                    });

                });

            });

        }


    }

}

function createPakoLoader(filename,eventName) {
    /*
    filename - path to the zipfile to deploy
             - this will become the root of the browser based file system.

    eventName - window.addEventListener event name to notify the browser that the file system is ready


    */
    var

    // build some filenames for output/temp work files
    jszip_filename = filename.replace(/\.zip$/,'.jszip'),
    pako_loader_fn = filename.replace(/\.zip$/,'.pako-loader.js'),
    pako_tester_fn = filename.replace(/\.zip$/,'.pako-tester.js'),


    // nodejs mods used
    fs   = require("fs"),
    path = require("path"),
    zlib = require('zlib'),
    pkgWrap =require("simple-package-wrap"),

    minifyJS   = pkgWrap.minifyJS,
    extract_fn = pkgWrap.extract_fn,

    // get path the pako minified inflater dist file
    PakoPackageFile=require.resolve("pako"),
    PakoPackagePath=path.dirname(PakoPackageFile),
    PakoMinifiedPath=path.join(PakoPackagePath,"dist","pako_inflate.min.js"),


    // build path to the browser-fs packaged files.
    // contains JSZip, JSZipUtils, zipFsWrap, fs_JSZip & start_fs
    // these form the core modules needed for the browser based file system
    JSZipMinifiedPath= __dirname+"/browser-fs.pkg.js",


    // make a single buffer out of the combined packages (add jsextensions reqiuire-sim for browser also)
    JSZipUncompressedBuffer = Buffer.concat([

        fs.readFileSync(JSZipMinifiedPath),

        Buffer.from(

            JSON.parse(
                fs.readFileSync(
                    path.join(path.dirname(require.resolve("jsextensions")),"require_simulator.json")
                )
            ).pkg.src
        )
    ]);


    var

    //load the pako inflator (minified uncompressed javascript)
    pakoLibBuffer  = fs.readFileSync(PakoMinifiedPath),
    //deflate the browser fs files
    jsZipLibBuffer = zlib.deflateSync(JSZipUncompressedBuffer),
    //load the compressed zipfile that contains the root file system
    zipFileBuffer  = fs.readFileSync(filename),

    // construct the bootloader object
    loader = JSZipBootloader(pakoLibBuffer , jsZipLibBuffer , zipFileBuffer);


    // write the raw jszip file (contains pako,compressed fs tools code, zipfile)
    fs.writeFileSync(jszip_filename,loader.buffer);
    //write the loader script
    fs.writeFileSync(pako_loader_fn,loader.script);
    //write node test server to launch a browser and test the file load
    fs.writeFileSync(pako_tester_fn,loader.nodeTester);


    function JSZipBootloader(PakoBuffer,JSZipBuffer,ZipFileBuffer) {

        var
        pakoOffsetStart,pakoOffsetEnd,
        JSZipOffsetStart,JSZipOffsetEnd,
        ZipFileOffsetStart,ZipFileOffsetEnd;

        //"loader" ends up (minified) at the start of the jszip file (without the function header or surrounding curly braces)
        // the various offsets are replaced with hardcoded values specific to the jszip file
        // so this effectively acts as a callable header, which loads the jszipfile into memory
        // the subfunction p() installs "pako" into window.pako
        // the subfunction z() uses pako to decompress the zlib'ed javasscript source for the fs core, which includes JSZip
        // once the zip has been loaded, cb is called with the zip object
        function loader(func,str,arr,exp,cb) {
            var
            p=function(){return func([],str(pakoOffsetStart,pakoOffsetEnd))();},
            z=function(){return func([],exp.pako.inflate(arr(JSZipOffsetStart,JSZipOffsetEnd),{to:'string'}))();};
            try {
                p();
                z();
                var zip = new exp.JSZip();
                zip.loadAsync(arr(ZipFileOffsetStart,ZipFileOffsetEnd))
                  .then(function(zip){cb(null,zip);})
                  .catch(cb);
            } catch(err) {
                cb(err);
            }
            p=z=null;
        }

        //bootload contains code that firstly detects "loader" at the start of a jszip file
        //this is acheived using a regex which looks for "p=z=null;" (being the last statement of loader)
        //since these 2 vars are already as short as they can be, and mangling is not turned on in uglify
        //they should remain the last code of loader, despite minification to remove whitespace etc.
        //args: ab = the arraybuffer containing the zip file
        //      exp = window (aka exports)
        //      cb  = callback for passing on to "loader".
        // subfunctions:
        // arr is a bound function giving a slice of ab (ie a new arraybuffer)
        // str() returns a string stored at a slice delimited between a+b of the arraybuffer (the js zip file)
        // func creates a function by invoking an array version of new Function.
        function bootload(ab,exp,cb) {
            var
            F=Function,
            arr=ab.slice.bind(ab),
            str=function(a,b){return String.fromCharCode.apply(null,new Uint8Array(arr(a,b)));},
            len=+'${bootlength}',

            re=new RegExp('^.*(?<=(p\\w*=\\w*z=\\w*null\\w*;))','s'),
            //re=/\[[0-9|\s]{7},[0-9|\s]{7},[0-9|\s]{7}\]/,
            m,NEW = function (C) {
               /*jshint -W058*/
               return new (F.prototype.bind.apply(C, arguments));
               /*jshint +W058*/
            },func = function (args,code){
               return NEW.apply(this,[F].concat(args,[code]));
            };

            //while (!(m=re.exec(str(0,len)))) {len += 10;}

            if ((m=re.exec(str(0,len)))) {
                return func(['func','str','arr','exp','cb'],m[0]) (func,str,arr,exp,cb);
            }
        }

        // load loadJSZip() fetches the jszip file from the server and opens it
        // uses a highly customized version of code found in JSZip Utils
        function loadJSZip (url,cb) {

            try {

                var
                r="responseType",
                x=new window.XMLHttpRequest();

                x.open('GET', url, true);

                if (r in x) {
                    x[r] = "arraybuffer";
                    x.ab = function(){return x.response};
                } else {
                    x.ab  = function () {
                        var s=x.responseText,ab=new ArrayBuffer(s.length*2);
                        var vw = new Uint16Array(ab);
                        for (var i=0, l=s.length; i<l; i++) {
                           vw[i] = s.charCodeAt(i);
                        }
                        return ab;
                    };
                }

                if(x.overrideMimeType) {
                    x.overrideMimeType("text/plain; charset=x-user-defined");
                }

                x.onreadystatechange = function (event) {
                    if (x.readyState === 4) {
                        if (x.status === 200 || x.status === 0) {
                            try {
                                bootload(x.ab(),window,cb);
                            } catch(err) {
                                cb(new Error(err));
                            }
                        } else {
                            cb(new Error("Ajax error for " + url + " : " + this.status + " " + this.statusText));
                        }
                    }
                };

                x.send();

            } catch (e) {
                cb(new Error(e), null);
            }



        }


        //browserSuffixFn is code which ends up calling loadJSZip & bootload & loader to load the zip file.
        //it is a template function which is updated with the appropriate filenames and eventNames as passed
        //into createPakoLoader().

        function browserSuffixFn(){
            loadJSZip( "${filename}", function(err,zip){
                if(err){
                    return;
                }

                    window.start_fs(zip,function(err,fs){

                        if(err){
                            return;
                        }


                        window.dispatchEvent(new CustomEvent("${eventName}",
                        {
                            detail:{zip:zip,fs:fs}

                        }));

                    });

                } );
        }

        function setVar(name,value,src) {
                return src.split(name).join(""+value);
        }

        function setValues(obj,src) {
            Object.keys(obj).forEach(function(k){
                src=setVar(k,obj[k],src);
            });
            return src;
        }



        var
        template  = loader.toString(),
        loadJSZip_src =
        minifyJS(extract_fn(bootload,{bootlength:template.length+20},true))+"\n"+
        minifyJS(loadJSZip.toString())+"\n",

        browserSuffix=minifyJS(extract_fn(browserSuffixFn,{
            filename:path.basename(jszip_filename),
            eventName:eventName
        })),

        src_fixed_temp,src_fixed,
        setVars=function() {
            pakoOffsetStart = src_fixed.length;
            pakoOffsetEnd   = pakoOffsetStart + PakoBuffer.length;

            JSZipOffsetStart   = pakoOffsetEnd;
            JSZipOffsetEnd     = JSZipOffsetStart+JSZipBuffer.length;

            ZipFileOffsetStart = JSZipOffsetEnd;
            ZipFileOffsetEnd   = ZipFileOffsetStart+ZipFileBuffer.length;

            src_fixed_temp = minifyJS(
                setValues({
                pakoOffsetStart    : pakoOffsetStart,
                pakoOffsetEnd      : pakoOffsetEnd,
                JSZipOffsetStart   : JSZipOffsetStart,
                JSZipOffsetEnd     : JSZipOffsetEnd,
                ZipFileOffsetStart : ZipFileOffsetStart,
                ZipFileOffsetEnd   : ZipFileOffsetEnd
            },template))+'/**/';

        };

        src_fixed = template = extract_fn(template)+"\n";

        setVars();

        while (src_fixed.length !==src_fixed_temp.length) {
            src_fixed = src_fixed_temp;
            setVars();
        }

        function nodeTester () {


            var
            fs = require("fs"),
            path = require("path"),
            express=require("express"),
            app = express(),
            filename = path.resolve("${filename}"),
            jszip_filename = filename.replace(/\.zip$/,'.jszip'),
            pako_loader_fn = filename.replace(/\.zip$/,'.pako-loader.js'),
            pako_html_fn = filename.replace(/\.zip$/,'.pako-tester.html'),
            //chromebooks do something funky with localhost under penguin/crostini, so help a coder out....
            hostname = isChromebook() ? "penguin.termina.linux.test" : "localhost",
            child_process           = require("child_process");

            function isChromebook() {
                var os = require("os");
                if (os.hostname()==="penguin" && os.platform()==="linux") {
                    var run=require("child_process").execSync;
                    try {
                        var cmd = run ("which systemd-detect-virt").toString().trim();
                        return (run(cmd).toString().trim()==="lxc");
                    } catch (e) {

                    }
                }
                return false;
            }

            var html = [
                       "<html>",
                       "<head></head>",
                       "<body>",
                       '<div id="dir">loading...</div>',
                       '<script src="/'+path.basename(pako_loader_fn)+'"></script>',
                       '<script>',

                       "\n"+selfTest.toString()+"\n",
                       extract_fn(function () {
                            window.addEventListener(
                              "${eventName}",
                              function(e){
                                var fs = window.fs = e.detail.fs;
                                var process = window.process = e.detail.process;
                                fs.readdir("/",function(err,files){
                                    document.getElementById("dir").innerHTML=files.join("<br>\n");
                                });
                                selfTest(function(){ });
                            });
                       }),



                       '</script>',
                       "</body>",
                       "</html>",
                       ].join("\n");

            fs.writeFileSync(pako_html_fn,html);

            app.get("/", function(req,res){
                res.send(html);
            });

            app.use("/"+path.basename(jszip_filename), express.static(jszip_filename));
            app.use("/"+path.basename(pako_loader_fn), express.static(pako_loader_fn));

            var listener = app.listen(3000, function() {
                var url =  'http://'+hostname+':' + listener.address().port + "/";
                console.log('goto '+url);
                child_process.spawn("xdg-open",[url]);
            });



        }

        return {
            script     : loadJSZip_src+browserSuffix,
            nodeTester :

                extract_fn(nodeTester,{filename:filename,eventName:eventName})+"\n"+
                extract_fn.toString()+"\n"+
                selfTest.toString().replace(/start\.file\(.*\);/,"tests(window.fs,window.process);")+"\n",

            buffer     : Buffer.concat([Buffer.from(src_fixed_temp),PakoBuffer,JSZipBuffer,ZipFileBuffer])
        };

    }
}


if (process.mainModule===module) {

    if (process.argv.indexOf("--build")>0) {

        var
        pkgWrap =require("simple-package-wrap"),
        pkgs = [
                  {
                       mod : "JSZip",
                       js  : path.join(path.dirname(require.resolve("jszip")),"..","dist","jszip.js"),
                       pkg : __dirname+"/jszip.pkg.js",
                       min : __dirname+"/jszip.min.js",
                   },

                   {
                       mod : "JSZipUtils",
                       js  : path.join(path.dirname(require.resolve("jszip-utils")),"..","dist","jszip-utils.js"),
                       pkg : __dirname+"/jszip-utils.pkg.js",
                       min : __dirname+"/jszip-utils.min.js",
                   },

                   {
                       mod : "zipFsWrap",
                       js  : path.join(path.dirname(require.resolve("jszip-fs-wrap")),"js_zipWrap.js"),
                       pkg : __dirname+"/zipFsWrap.pkg.js",
                       min : __dirname+"/zipFsWrap.min.js",
                   },

                   {
                       mod : "fs_JSZip",
                       js  : __dirname+"/fs_jszip.js"
                   },

                   {
                       mod : "start_fs",
                       js  : __dirname+'/fs_jszip-browser.js'
                   }

                   ];
        pkgWrap.buildNamed(pkgs, __dirname+"/browser-fs.js",function(err,list,built,preBuilt){

            createPakoLoader(
                __dirname+"/jszip_test.zip",
                "browserFSLoaded"
            );

        });

    } else {
        selfTest(function(){ });
    }
}
