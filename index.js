const cprfork = require("child_process").fork;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const activeDBs = [];
const setup = ({location, secDatFileLoc, updateInterval=60, cb})=>new Promise((res, rej)=>{
    const dbfind = searchActive(location)
    if(activeDBs.length==0||activeDBs[dbfind]["location"]!==location){
        let good = true;
        if (!fs.existsSync(secDatFileLoc)){
            const secdat = {key: crypto.randomBytes(16).toString("base64"), iv:crypto.randomBytes(16).toString("base64")};
            const sdfp = path.dirname(path.resolve(secDatFileLoc)).split(path.sep);
            if (!fs.existsSync(sdfp[0])){
                good = false;
                rej({error: 404, messae:"Drive " + sdfp[0] + " doesn't exist"})
            }else{
                let pathnow = sdfp[0];
                for(let i = 1; i < sdfp.length; i++){
                    pathnow = path.join(pathnow, sdfp[i]);
                    if (!fs.existsSync(pathnow)){
                        fs.mkdirSync(pathnow);
                    }
                }
                fs.writeFileSync(secDatFileLoc, JSON.stringify(secdat));
            }
        }
        if (good){
            const cpr = cprfork("./src/jablesSubprocWrapper", [], {stdio:["ipc"]});
        cpr.on("message", (message)=>{
            getTargetJObj(location).cb(message.message);
        })
        cpr.on("error", (err)=>{
            console.log(err);
        })
        cpr.on("disconnect", ()=>{console.log(cpr.pid + " disconnected") });
        cpr.on("exit", (code, signal)=>{
            console.log(code, signal);
        })
        cpr.on("close", (code, signal)=>{
            console.log(code, signal);
        })
        if (activeDBs.length==0||dbfind==activeDBs.length-1&&location>activeDBs[dbfind]["location"]){
            activeDBs.push({location, cpr, cb});
        }else if (dbfind==0&&location<activeDBs[dbfind]["location"]){
            activeDBs.shift({location, cpr, cb});
        }else {
            activeDBs.splice(dbfind+1, 0, {location, cpr, cb})
        }
        
        const secDat = JSON.parse(fs.readFileSync(secDatFileLoc).toString());
        
        if(cpr.send({functionName: "setup", location, args:[location, {iv: secDat.iv, key: secDat.key}, updateInterval]})){
            res("jables initiated at " + location);
        }else{
            rej({error: 500, message:"IPC"});
        }
    }
        
        
    }else{
        rej({error: 406, message:"Database at " + location + " already initialized"});
    }
})
const getTargetJObj = (location)=>{
    const rs = activeDBs[searchActive(location)];
    if (rs.location === location){
        console.log("found", rs.cb.toString())
        return rs;
    }
    return undefined;
}
const searchActive = (location)=>{
    let search = activeDBs.map((item)=>item);
        let bound = Math.round(search.length/2);
        while(search.length>1){
            if (location<search[bound]["location"]){
                search.splice(bound, search.length-bound);
            }else{
                search.splice(0, bound);
            }
            bound=Math.round(search.length/2);
        }
        return activeDBs.indexOf(search[0]);
}
const getDefinitions = ({location, definition, strict})=>{
    getMiscFunc({location, functionName:"definitions", args:[{definition, strict}]});
}
const getDefinition = ({location, definition})=>{
    getMiscFunc({location, functionName:"getDefinition", args:[definition]});
}
const getDefinitionProperties = ({location, definition})=>{
    getMiscFunc({location, functionName:"getDefinitionProperties", args:[definition]});
}
const getDefinitionProperty = ({location, definition})=>{
    getMiscFunc({location, functionName:"getDefinitionProperty", args:[definition]});
}
const getTwig = ({location, definition})=>{
    getMiscFunc({location, functionName:"getTwig", args:[definition]});
}
const getTwigBFD = ({location, definition})=>{
    getMiscFunc({location, functionName:"getTwigBFD", args:[definition]});
}
const writeDefinition = ({location, definition})=>{
    getMiscFunc({location, functionName:"writeDefinition", args:[definition]})
}
const deleteDefinition = ({location, definition})=>{
    getMiscFunc({location, functionName:"deleteDefinition", args:[definition]})
}
const getMiscFunc = ({location, args, functionName})=>{
    const target = getTargetJObj(location);
    if (target){
        return target.cpr.send({location, functionName, args})
    }
    return false;
}
module.exports = {
    setup,
    getDefinitions,
    getDefinition,
    getDefinitionProperties, 
    getDefinitionProperty,
    getTwig,
    getTwigBFD,
    writeDefinition,
    deleteDefinition,
    getMiscFunc
}