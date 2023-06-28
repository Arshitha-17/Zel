const mongoose=require('mongoose');
const walletSchema=mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    totalRefundAmount:{
      type:Number,
      required:false
    },
    cancel: [
        {
          orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'order',
            required: true
          },
          cancelAmount: {
            type: Number,
            required: true,
            min: 0,
            max: 5000 
            },
            refundDate: {
                type: Date,
                default: new Date()
              },
            
        }
      ]

})

module.exports= mongoose.model('wallet',walletSchema);
