module.exports  = {
    ready   : false,
    fs      : null,
    process : null,

    start    : start,
    selfTest : selfTest

};

var

fs          = require("fs"),path=require("path"),
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
                            cb();
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


    }

}


if (process.mainModule===module) {

    if (process.argv.indexOf("--build")>0) {
        require("simple-package-wrap").buildMulti([
            {
                mod : "JSZip",
                js  : path.join(path.dirname(require.resolve("jszip")),"..","dist","jszip.js"),
                pkg : __dirname+"/jszip.pkg.js",
                min : __dirname+"/jszip.min.js",
            },

            {
                mod : "JSUtils",
                js  : path.join(path.dirname(require.resolve("jszip-utils")),"..","dist","jszip-utils.min.js"),
                pkg : __dirname+"/jszip-utils.pkg.js",
                min : __dirname+"/jszip-utils.min.js",
            },

            {
                mod : "fs_js_zip",
                js  : __dirname+"/fs_jszip.js"
            },

            {
                mod : "start_fs",
                js  : __dirname+'/fs_jszip-browser.js'
            }

            ],

            "./browser-fs.js");
    } else {
        selfTest(function(){ });
    }
}
