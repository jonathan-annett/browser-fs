var
                fs = require("fs"),
                path = require("path"),
                express=require("express"),
                app = express(),
                filename = path.resolve("/home/jonathanmaxannett/browser-fs/browser-fs.pkg.zip"),
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
                           "it all happens in the console.",
                           '<script src="/'+path.basename(pako_loader_fn)+'"></script>',
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
