const express=require('express');
const app=express();

app.set('view engine','ejs');
// app.set('views','./views');
app.set('views','./views');
const path = require('path');

const multer = require('multer')

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,'../public/images'))
    },
    filename:(req,file,cb)=>{
        const name = Date.now()+'-'+file.originalname
        cb(null,name)
    }
  })
  
const upload = multer({storage:storage})

const adminController= require('../controllers/adminController');

app.get('/',adminController.isAdminLogout,adminController.loginPage);
app.post('/',adminController.loginVerify);

app.get('/adminforget',adminController.adminForgetPage);
app.post('/adminforget',adminController.adminForgetPostMethod);

app.get('/adminOtpVerification',adminController.adminOtpVerification);
app.post('/adminOtpVerification',adminController.adminOtpPostMethod);

app.get('/adminResetPassword',adminController.adminResetPassword)
app.post('/adminResetPassword',adminController.adminResetPasswordPostMethod)

// Admin dashboard
app.get('/adminDashboard',adminController.isAdminLogIn,adminController.dashboardLoad)

app.get('/orderStatus',adminController.loadOrderStatus)

app.post('/admin/approveDelivery',adminController.approveDelivery)

app.get('/addcategory',adminController.isAdminLogIn,adminController.adminCategory)
app.post('/addcategory',adminController.adminAddCatogery)

app.get('/deteleCategory',adminController.deleteCategory)

app.get('/adminProductList',adminController.isAdminLogIn,adminController.adminProductList)

app.get('/adminAddProduct',adminController.isAdminLogIn,adminController.adminAddProduct)
app.post('/adminAddProduct',upload.array('image',5),adminController.insertProduct)

app.get('/adminDeleteProduct',adminController.adminDeleteProduct)

app.get('/editProduct',adminController.isAdminLogIn,adminController.editProduct)
app.post('/editProduct',upload.array('image',5),adminController.adminEditProductPost)

app.get('/userList',adminController.isAdminLogIn,adminController.userList)

app.get('/userBlock',adminController.isAdminLogIn,adminController.adminUserBlock)

app.get('/addCoupon',adminController.addCoupon)
app.post('/addCoupon',adminController.addCouponPostMethod)

app.get('/couponList',adminController.loadCouponList)

app.get('/userUnblock',adminController.isAdminLogIn,adminController.userUnblock);


app.get('/adminlogout',adminController.isAdminLogout,adminController.adminLogout)

module.exports=app;
