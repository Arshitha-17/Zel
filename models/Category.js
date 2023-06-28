const mongoose = require('mongoose')

const categorySchema=new mongoose.Schema({
    category:{
        type:String,
        required:true
    },
    categoryOffer:{
        type:Number,
        required:true
    }
})

module.exports=mongoose.model('Category',categorySchema)