const mongoose= require('mongoose');
const product = require('./product');

const cartSchema=new mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    product:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Product',
            },
            quantity:{
                type:Number,
                default:1,
                required:false,
            },
            weight:{
                type:Number,
                required:false,
            },
            newPrice:{
                type:Number,
                required:false
            }
            
        },
    ],
});

module.exports=mongoose.model('cart',cartSchema);