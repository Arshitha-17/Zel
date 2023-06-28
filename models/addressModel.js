const mongoose = require('mongoose');


const addressSchema = mongoose.Schema({

   userid :{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
   },
   name:{
    type:String,
    required:true
   },
   address:{
      type: String,
      required: true
   },
  phone:{
    type:Number,
    required:true
  },
  state:{
    type:String,
    required:true
  }
});

module.exports = mongoose.model('addres',addressSchema)
