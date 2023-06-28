const mongoose=require('mongoose');
const adminSchema=new mongoose.Schema({
    adminKey:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        default:''
    }
});

module.exports=mongoose.model('Admin',adminSchema);