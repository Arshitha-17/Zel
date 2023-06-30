const mongoose= require('mongoose');
const DB= 'mongodb+srv://arshithaachu165:fXW68wcuc41iUdaH@cluster0.wwbby5a.mongodb.net/zel_cakes?retryWrites=true&w=majority'

mongoose.connect(DB).then(()=>{
    console.log('connection successfully');
}).catch((error)=>{
    console.log(error);
})
const nocache=require('nocache');
const path=require('path');
const express= require('express');
const app=express();
app.use(nocache());


app.use(express.static(path.join(__dirname,"public")))
app.use(express.static("public"))

//for User Rpote
const userRoute=require('./routes/userRoute')
app.use('/',userRoute);

// for admin route
const adminRoute=require('./routes/adminRoute');
app.use('/admin',adminRoute)


app.listen(3000,function(){
    console.log('server running....');
});