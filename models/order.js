const mongoose= require('mongoose');

 const orderSchema =   mongoose.Schema({

   userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    requried: true
   },
   product :[{
    product_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required: true
    },
    quantity:{
        type:Number,
        required:true
    },
    weight:{
        type:String,
        required:false
    }
    }],
    total:{
        type:Number,
        required:true
    },
    coupon:{
        type:String,
        default:0
    },
    paymentMethod:{
     type:String,
     required:true
    },
   status:{
    type:String,
    default:"Pending"
   },
   address:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"addres",
    required: true
   },
orderDate:{
    type: Date,
    default: Date.now
},
itemquantity:{
    type:Number,
    required:true
},
category_id:{
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Category',
     required:false, 
},
return:{
    status:{
        type:Boolean,
        default:false
    },
    reason:{
        type:String,
        required:false
    },
    date:{
        type:Date
    }
},
delivered:{
    status:{
        type:Boolean,
        required:false
    },
    deliveryDate:{
        type:Date,
        required:false
    }
},
expectedDeliveryDate:{
    type:Date
},
canceld:{
    type:Boolean,
    default:false
}

 })
 module.exports = mongoose.model('order',orderSchema);