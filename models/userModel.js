const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
  
    is_admin:{
        type:Number,
        default:0
    },
    is_verified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    },
    otp:{
        type:String,
        default:''
    },
    is_blocked:{
        type:Boolean,
        default:false
    },
    wallet:{
        type:Number,
        default:false
    },
    referralCode:{
        type:String,
        required:false
    }
});

module.exports= mongoose.model('User',userSchema);
