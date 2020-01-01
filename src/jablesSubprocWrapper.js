const jables = require("jables/proc/fetchData");
process.on("message", (message)=>{
    try{
        if(!jables[message.functionName]){
            return process.send({location:message.location, message:message.functionName + " doesn't exist on jables"});
        }
        const sync = ["setup"];
        const dunction = jables[message.functionName];
        if (sync.includes(message.functionName)){
            const m = dunction(...message.args);
            return process.send({location: message.location, message: m!=undefined?m:"undefined response", jobID:message.jobID, rtype:"sync"});
        }
        dunction(...message.args).then((ful)=>{
            return process.send({location: message.location, message: ful!=undefined?ful:"undefined response", jobID:message.jobID, rtype:"resolve"});
        }).catch((err)=>{
            return process.send({location: message.location, message: err, jobID: message.jobID, rtype:"reject"});
        })
    }catch(e){
        process.send({location: message.location, message:{error:500, message:e}, jobID:message.jobID, rtype:"error"});
    }
    
})