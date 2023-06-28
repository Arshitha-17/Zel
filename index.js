const mongoose= require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/zel_cake');
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