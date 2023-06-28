const adminModel = require('../models/adminModel');
const bcrypt=require('bcrypt');

const nodemailer=require('nodemailer');
const config= require('../config/config');
const Product = require('../models/product');
const UserList= require('../models/userModel')
const Category = require('../models/Category');
const orderModel=require('../models/order')
const couponModel=require('../models/couponModel')
const walletModel=require('../models/wallet');
// const { render } = require('../routes/adminRoute');

const securePassword=async(password)=>{
    try {
        const hashedPassword=await bcrypt.hash(password,10);
        return hashedPassword;
    } catch (error) {
        console.log(error.message);
    }
}


const loginPage=async(req,res)=>{
    try {
        console.log("adminlogin");
        res.render('admin/adminLogin')
        return;
    } catch (error) {
        console.log(error.message);
    }
}

const loginVerify= async(req,res)=>{
    try {

        const productData=await Product.find({})

        const adminKey=req.body.adminKey;
        console.log(adminKey);
        const password=req.body.password;
        console.log(password);
        const is_Match_admin=await adminModel.findOne({adminKey:adminKey})
        if(is_Match_admin){
            let passwordMatch= await bcrypt.compare(password,is_Match_admin.password);
            if(passwordMatch){
                req.session.adminLoggedIn=true
                res.redirect('/admin/adminDashboard')
            }else{
                res.render('admin/adminLogin',{message:'invalid password '})
            }
            
          
        }else{
            console.log('user not found');
            res.render('admin/adminLogin',{message:'admin key not found'})
        }
    } catch (error) {
        console.log(error.message);
    }
}

// otp send mail
const sendOtp=async(email,otp)=>{
    try {
        console.log(`Inside Email function${email},${otp}`)
        const transporter=nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
        });
        const mailOptions={
            from:config.emailUser,
            to:email,
            subject:'for reset password',
            html:'<p> Hii  , Your OTP is '+otp+' </p>'
            // html:'<p> Hii '+name+', please click here to <a href="http://127.0.0.1:3000/forget?token='+token+'"> Reset </a> your password.</p>'
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log('email has been sent:- ',info.response);
            }
        })
        
    } catch (error) {
        console.log(error.message);
    }
}


// forget password


const adminForgetPage=async(req,res)=>{
    try {
        res.render('admin/adminForget')
    } catch (error) {
        console.log(error.message);

    }
}

const adminForgetPostMethod= async(req,res)=>{
    try {
        console.log("inside forget post method");
        const adminKey=req.body.adminKey;
        const is_Match_admin=await adminModel.findOne({adminKey:adminKey})

        console.log(adminKey);
        if(is_Match_admin){
            console.log("Generating OTP Email")
            let OTPgenerated=Math.floor(100000 + Math.random() * 900000);
            sendOtp(is_Match_admin.adminKey,OTPgenerated);
            const OTPAddedToDatabase=await adminModel.updateOne({adminKey:adminKey},{$set:{otp:OTPgenerated}});
            console.log("Set OTP to Database");
            req.session._id=is_Match_admin._id;

           res.render('admin/adminOtpVerification')
        }
        else{
            res.render('admin/adminForget',{message:"invalid adminkey"});
        }
       
    } catch (error) {
        console.log(error.message);
    }
}

const adminOtpVerification= async(req,res)=>{
    try {
        res.render('admin/adminOtpVerification')
    } catch (error) {
        console.log(error.message);
    }
}

const adminOtpPostMethod=async(req,res)=>{
    try {
        const adminOtp=req.body.otp;
        console.log(req.session._id);
        const is_Match_admin=await adminModel.findById({_id:req.session._id});
        console.log(is_Match_admin.adminKey);

        req.session._id=is_Match_admin._id;
        if(is_Match_admin.otp===adminOtp){
            res.render('admin/adminResetPassword')
        }
        else{
            res.render('admin/adminOtpVerification',{message:'otp error'})
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const adminResetPassword=async(req,res)=>{
    try {
        res.render('admin/adminResetPassword')
    } catch (error) {
        console.log(error.message);
    }
}

const adminResetPasswordPostMethod=async(req,res)=>{
    try {
        console.log("Inside Post Method")
        const password=req.body.password; 
        console.log(password);
        const sPassword=await securePassword(password);

        const is_Match_admin=await adminModel.findById({_id:req.session._id});
        console.log(is_Match_admin._id);

        const updatedData= await adminModel.findByIdAndUpdate({_id:is_Match_admin._id},{$set:{password:sPassword,otp:''}});
        res.render('admin/home')

    } catch (error) {
        console.log(error.message);
    }
}

const dashboardLoad=async(req,res)=>{
    try {
        console.log('inside dashboard');
        const admin=await adminModel.findOne()     
        const orders=await orderModel.find({}).populate('address').populate('userId').exec()
        const pendingOrders= orders.filter(order=>order.status==='Pending')
        const cancelledOrders= orders.filter(order=>order.status==='Cancelled')
        const deliveredOrders= orders.filter(order=>order.status==='Delivered')
        const netBanking=orders.filter(order=>order.paymentMethod==='Net Banking')
        const cod=orders.filter(order=>order.paymentMethod==='Cash on Delivery')
        const totalAmount= orders.reduce((sum,pointer)=>{
            return sum+pointer.total;
        },0)
        const wallet=await walletModel.findOne({})
        const refundAmount=wallet.cancel.reduce((sum,refund)=>{
            return sum+refund.cancelAmount;
        },0)
        const totalSaleAmount=totalAmount - refundAmount
        console.log(totalSaleAmount)

        res.render('admin/adminDashboard',
        {
            title:"Dashboard",
            admin,orders,
            pendingOrders,
            cancelledOrders,
            deliveredOrders,
            totalSaleAmount,
            refundAmount,
            netBanking,
            cod
        })
    } catch (error) {
        console.log(error.message)
    }
}

// Order Status
const loadOrderStatus=async(req,res)=>{
    try {

        const admin=await adminModel.findOne()     
        const orders=await orderModel.find({}).populate('address').populate('userId').populate('product.product_id').exec()
        res.render('admin/orderStatus',
        {
            title:"orderStatus",
            admin,orders,
           
        })
    } catch (error) {
        console.log(error.message)
    }
}
// approveDelivery
const approveDelivery = async (req, res) => {
    try {
      console.log('inside Delivery');
      const orderId = req.body.orderId;
      console.log(orderId);
      const currentDate=new Date();
      const formattedDate=currentDate.toISOString().split('T')[0];
      console.log(formattedDate);
      const update={
        delivered:true,
        'deliveredDate':formattedDate,
        status:'Delivered'
      };
      const updatedDelivery= await orderModel.findByIdAndUpdate(orderId,update);
      console.log(updatedDelivery);
      res.json({success:true});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({success:false,error:error.message})
    }
  }


//add category
const adminCategory=async(req,res)=>{
    try {
        let categories=await Category.find({}).lean();
        const admin=await adminModel.findOne()
        res.render('admin/catogeries',{categories:categories,admin})
        

    } catch (error) {
        console.log(error.message);
    }
}

const adminAddCatogery = async (req, res) => {
    try {
      let category = req.body.category;
      let offer = req.body.offer;
      console.log(offer);
  
      const checkCategory = await Category.findOne({ category: { $regex: category, $options: 'i' } });
      if (checkCategory) {
        let categories = await Category.find({}).lean();
        res.render('admin/catogeries', { message: 'This Category already exists', categories: categories });
      } else {
        const newCategory = new Category({
          category: category,
          categoryOffer: offer
        });
        await newCategory.save();
      }
      res.redirect('/admin/addcategory');
    } catch (error) {
      console.log(error.message);
    }
  };
  


const deleteCategory=async(req,res)=>{
    try {
       let categoryId=req.query.id;
       let deleteCategory= await Category.findByIdAndDelete(categoryId) 
       if(deleteCategory){
        res.redirect('/admin/addcategory')
       }
    } catch (error) {
        console.log(error.message);
    }
}


// product list
const adminProductList= async(req,res)=>{
    try {
        const product =await Product.find({}).lean();
        const admin=await adminModel.findOne()
        res.render('admin/productList',{title:'Admin productList', productData:product,admin})
        
    } catch (error) {
        console.log(error.message );
    }
}

const adminAddProduct=async(req,res)=>{
    try {
        const categoryList=await Category.find({}).lean();
        res.render('admin/adminAddProduct',{title:'Add Product',categoryList})
        
    } catch (error) {
        console.log(error.message);
    }
}
const insertProduct=async(req,res)=>{
    try {
        console.log('in the body');
        console.log(req.body);
        const product = new Product({
            name:req.body.name,
            price:req.body.price,
            category:req.body.category,
            stock:req.body.stock,
            description:req.body.description,
            weight:req.body.weight,
            image:req.files.map((file)=>file.filename)
        })
        const productData=await product.save()
        if(productData){
            res.redirect('/admin/adminProductList')
        }
        else{
            console.log('upload error');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const adminDeleteProduct=async(req,res)=>{
    try {
        
        let ProductId=req.query.id;
        console.log(ProductId);

        const productData= await Product.findByIdAndDelete({_id:ProductId})
        console.log(productData);
        res.redirect('/admin/adminProductList')

    } catch (error) {
        console.log(error.message);
    }
}

const editProduct=async(req,res)=>{
    try {
        let categoryList=await Category.find({}).lean();
        let editProduct=await Product.findById({_id:req.query.id}).lean();

        console.log(editProduct);

        res.render('admin/editProduct',{title:'edit product',editProduct,categoryList})

    } catch (error) {
        console.log(error.message);
    }
}

const adminEditProductPost=async(req,res)=>{
    try {
        let currentProduct=await Product.findById(req.query.id);
        let updateFields={
            name:req.body.name,
            price:req.body.price,
            category:req.body.category,
            stock:req.body.stock,
            description: req.body.description,
            weight:req.body.weight,
            image: currentProduct.image
        }
        if (req.files && req.files.length > 0) {
            updateFields.image = req.files.map((file) => file.filename);
          }

          const product=await Product.findByIdAndUpdate(
            {_id:req.query.id},
            {$set:updateFields}
          );

          console.log(product);

          if(product){
            res.redirect('/admin/adminProductList')
          }


    } catch (error) {
        console.log(error.message);
    }

}

const userList= async(req,res)=>{
    try {
        const userDetails= await UserList.find({}).lean()
        const admin=await adminModel.findOne()
        res.render('admin/userList',{title:' User List',userDetails,admin})
    } catch (error) {
        console.log(error.message);
    }
}

const adminUserBlock=async(req,res)=>{
    try {
        const userId=req.query.id;
        await UserList.findByIdAndUpdate({_id:userId},{$set:{is_blocked:true}});
        res.redirect('/admin/userList')
    } catch (error) {
        console.log(error.message);
    }
}

const userUnblock=async(req,res)=>{
    try {
        let userId=req.query.id;
        await UserList.findByIdAndUpdate({_id:userId},{$set:{is_blocked:false}});
        res.redirect('/admin/userList')
    } catch (error) {
        console.log(error.message);
    }
}

//add coupon 
const addCoupon=async(req,res)=>{
    try {
        res.render('admin/addCoupon')
    } catch (error) {
        console.log(error.message);
    }
}

const addCouponPostMethod = async (req, res) => {
    try {
      console.log('inside coupon post ');
  
      const existingCoupon = await couponModel.findOne({ couponName: req.body.name });
      if (existingCoupon) {
        // Coupon with the same name already exists
        return res.render('admin/addCoupon', { error: 'Coupon with the same name already exists.' });
      }
  
      console.log(req.body);
      const coupon = new couponModel({
        couponName: req.body.name,
        couponAmount: req.body.amount,
        couponExprireDate: req.body.expire_date,
        couponDescription: req.body.description,
        minimumAmount: req.body.minimumAmount,
        category: req.body.category
      });
  
      const savedCoupon = await coupon.save();
      res.redirect('/admin/couponList');
    } catch (error) {
      console.log(error.message);
    }
  };
  

//Coupon list 
const loadCouponList=async(req,res)=>{
    try {
        console.log('inside product list');
        const coupon= await couponModel.find()
        // console.log(coupon);
        // Check for expired coupons and delete them
        // Check for expired coupons and delete them
    const currentDate = new Date();
    for (let i = 0; i < coupon.length; i++) {
      if (coupon[i].couponExprireDate < currentDate) {
        await couponModel.findByIdAndDelete(coupon[i]._id);
        coupon.splice(i, 1);
        i--;
      }
    }
        res.render('admin/couponList',{coupon})
    } catch (error) {
        console.log(error.message);
    }
}



//LOGIN AUTHENTICATION
const isAdminLogIn=(req,res,next)=>{
    try {
        if(req.session.adminLoggedIn){
            next()
        }else{
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error.message)
    }
    
}

const isAdminLogout=(req,res,next)=>{
    try {
        if(req.session.adminLoggedIn){
            res.redirect('/admin/home')
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}


const adminLogout= async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}








module.exports={
    loginPage,
    loginVerify,
    adminForgetPage,
    adminForgetPostMethod,
    adminOtpVerification,
    adminOtpPostMethod,
    adminResetPassword,
    adminResetPasswordPostMethod,
    dashboardLoad,
    loadOrderStatus,
    approveDelivery, 
    adminCategory,
    adminAddCatogery,
    deleteCategory,
    adminProductList,
    adminAddProduct,
    insertProduct,
    adminDeleteProduct,
    editProduct,
    adminEditProductPost,
    userList,
    adminUserBlock,
    userUnblock,
    addCoupon,
    addCouponPostMethod,
    loadCouponList,
    isAdminLogIn,
    isAdminLogout,
    adminLogout
}