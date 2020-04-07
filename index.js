const cprfork = require("child_process").fork;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const activeDBs = [];
const setup = ({location, secDatFileLoc, updateInterval=60})=>new Promise((res, rej)=>{
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
            const cpr = cprfork("./node_modules/jables-multiproc/src/jablesSubprocWrapper", [], {stdio:["ipc"]});
        cpr.on("message", (message)=>{
            const target = getTargetJObj(location);
            target.jobs[message.jobID][message.rtype](message.message);
            target.jobs[message.jobID] = undefined;
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
            activeDBs.push({location, cpr, jobs:[]});
        }else if (dbfind==0&&location<activeDBs[dbfind]["location"]){
            activeDBs.shift({location, cpr, jobs:[]});
        }else {
            activeDBs.splice(dbfind+1, 0, {location, cpr, jobs:[]});
        }
        
        const secDat = JSON.parse(fs.readFileSync(secDatFileLoc).toString());
        if (secDat.key.data){
            secDat.key=secDat.key.data;
        }
        if (secDat.iv.data){
            secDat.iv=secDat.iv.data;
        }
        getMiscFunc({location, functionName:"setup", args:[location, {iv: secDat.iv, key: secDat.key}, updateInterval], callbacks:{resolve: res, reject: rej}});
    }
        
        
    }else{
        rej({error: 406, message:"Database at " + location + " already initialized"});
    }
})
const getTargetJObj = (location)=>{
    const rs = activeDBs[searchActive(location)];
    if (rs.location === location){
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
const getDefinitions = ({location, definition, strict})=>new Promise((res, rej)=>{
    getMiscFunc({location, functionName:"definitions", args:[{definition, strict}], callbacks:{resolve:res, reject:rej}});
});
const getDefinition = ({location, definition})=>new Promise((res, rej)=>{
    getMiscFunc({location, functionName:"getDefinition", args:[definition], callbacks:{resolve:res, reject:rej}});
})
const getDefinitionProperties = ({location, definition})=>new Promise((res, rej)=>{
    getMiscFunc({location, functionName:"getDefinitionProperties", args:[definition], callbacks:{resolve:res, reject:rej}});
})
const getDefinitionProperty = ({location, definition})=>new Promise((res, rej)=>{
    getMiscFunc({location, functionName:"getDefinitionProperty", args:[definition], callbacks:{resolve:res, reject:rej}});
})
const getTwig = ({location, definition})=>new Promise((res, rej)=>{
    getMiscFunc({location, functionName:"getTwig", args:[definition], callbacks:{resolve:res, reject:rej}});
})
const getTwigBFD = ({location, definition})=>new Promise((res, rej)=>{
    getMiscFunc({location, functionName:"getTwigBFD", args:[definition], callbacks:{resolve:res, reject:rej}});
})
const writeDefinition = ({location, definition})=>new Promise((res, rej)=>{
    getMiscFunc({location, functionName:"writeDefinition", args:[definition], callbacks:{resolve:res, reject:rej}})
})
const deleteVersion = ({location, definition})=>new Promise((res, rej)=>{
    getMiscFunc({location, functionName:"deleteVersion", args:[definition], callbacks:{resolve:res, reject:rej}})
})
const getMiscFunc = ({location, args, functionName, callbacks={sync:console.log, resolve:console.log, reject:console.log, error:console.log}})=>{
    const target = getTargetJObj(location);
    if (target){
        let jobID = 0;
        while(target.jobs[jobID]!=undefined){
            jobID++;
        }
        target.jobs[jobID]=callbacks;
        return target.cpr.send({location, functionName, args, jobID})
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
    deleteVersion,
    getMiscFunc
}
