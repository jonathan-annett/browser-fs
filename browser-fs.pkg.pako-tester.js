function bootload(ab,exp,cb){var F=Function,arr=ab.slice.bind(ab),str=function(a,b){return String.fromCharCode.apply(null,new Uint8Array(ab.slice(a,b)))},len=230,re=new RegExp('^.*(?<=\\/\\*.*\\*\\/)','s'),m,newCall=function(Cls){return new(F.prototype.bind.apply(Cls,arguments))},func=function(args,code){return newCall.apply(this,[F].concat(args,[code]))};while(!(m=re.exec(str(0,len)))){len+=10}return func(['func','str','arr','exp','cb'],m[0])(func,str,arr,exp,cb)}
function loadJSZip(url,cb){try{var xhr=new window.XMLHttpRequest;xhr.open("GET",url,true);if("responseType"in xhr){xhr.responseType="arraybuffer";xhr.ab=function(){return xhr.response}}else{xhr.ab=function(){var s=xhr.responseText,ab=new ArrayBuffer(s.length*2);var vw=new Uint16Array(ab);for(var i=0,l=s.length;i<l;i++){vw[i]=s.charCodeAt(i)}return ab}}if(xhr.overrideMimeType){xhr.overrideMimeType("text/plain; charset=x-user-defined")}xhr.onreadystatechange=function(event){if(xhr.readyState===4){if(xhr.status===200||xhr.status===0){try{bootload(xhr.ab(),window,cb)}catch(err){cb(new Error(err))}}else{cb(new Error("Ajax error for "+url+" : "+this.status+" "+this.statusText))}}};xhr.send()}catch(e){cb(new Error(e),null)}}
var
                fs = require("fs"),
                path = require("path"),
                express=require("express"),
                app = express(),
                filename = path.resolve("/home/jonathanmaxannett/browser-fs/browser-fs.pkg.zip"),
                jszip_filename = filename.replace(/\.zip$/,'.jszip'),
                pako_loader_fn = filename.replace(/\.zip$/,'.pako-loader.js'),
                pako_html_fn = filename.replace(/\.zip$/,'.pako-tester.html');

                fs.writeFileSync(pako_html_fn,[
                    "<html>",
                    "<head></head>",
                    "<body>",
                    "it all happens in the console.",
                    '<script src="/'+path.basename(pako_loader_fn)+'"></script>',
                    "</body>",
                    "</html>",
                    ].join("\n"));

                app.use("/"+path.basename(jszip_filename), express.static(jszip_filename));
                app.use("/"+path.basename(pako_loader_fn), express.static(pako_loader_fn));
                app.get("/", express.static(pako_html_fn));

                app.listen(3000);