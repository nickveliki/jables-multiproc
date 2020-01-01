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
            return process.send({location: message.location, message: m!=undefined?m:"undefined response"});
        }
        dunction(...message.args).then((ful)=>{
            return process.send({location: message.location, message: ful!=undefined?ful:"undefined response"});
        }).catch((err)=>{
            return process.send({location: message.location, message: err});
        })
    }catch(e){
        process.send({location: message.location, message:{error:500, message:e}})
    }
    
})