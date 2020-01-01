const jables = require("./index");
jables.setup({location:"./test2/test2/", secDatFileLoc:"./test2/.secdat"});
const handlewrite = (definition)=>{
    jables.writeDefinition({location:"./test2/test2/", definition}).then((ful)=>{
        console.log(ful);
        console.log("yay!");
    }).catch((err)=>{
        console.log(err);
        console.log("yay?");
    })
}
module.exports=handlewrite;