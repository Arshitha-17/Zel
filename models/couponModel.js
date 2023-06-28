const mongoose= require('mongoose');
const couponSchema= new mongoose.Schema({

    couponName:{
        type:String,
        required:true
    },
    couponAmount:{
        type:Number,
        required:true
    },
    couponExprireDate:{
        type:Date,
        required:true
    },
    couponDescription:{
        type:String,
        required:true
    },
    minimumAmount:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        required:true
    }
});
module.exports=mongoose.model('coupon',couponSchema)


