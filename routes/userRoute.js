const express= require('express');
const user_route=express();
const nodemailer = require('nodemailer');
const multer = require('multer')

user_route.set('view engine','ejs');
user_route.set('views','./views/users');

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


const bodyParser= require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));
const  session=require('express-session');
// const MongoDBStore = require('connect-mongodb-session')(session);

const mongoStore = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/zel_cake',
    collection: 'sessions'
});

const  config=require('../config/config')

user_route.use(session({
    secret:config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    // store: mongoStore,
}));

const auth=require('../middleware/auth')

const userController= require('../controllers/userController');

user_route.get('/home',userController.homeLoad)
// user_route.post('/home',userController.homePost)

user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser)
user_route.get('/verify',userController.verifyMail)
user_route.post('/duplicateUser',userController.duplicateUser)

user_route.get('/',auth.isLogout,userController.loginPage);
user_route.post('/login',userController.loginUserVerify)

user_route.get('/logotp',auth.isLogout,userController.logWithOtp);
user_route.post('/logotp',userController.OTPEmailVerify)

user_route.get('/otpverify',userController.OTPFind)
user_route.post('/otpverify',userController.OTPpostMethod)

user_route.get('/forgetpassword',auth.isLogout,userController.forgetPassword);
user_route.post('/forgetpassword',userController.forgetVerify);

user_route.get('/forget',auth.isLogout,userController.forget);
user_route.post('/forget',userController.resetPassword);

user_route.get('/productDetails/',userController.productDetailPage);


user_route.get('/categorySorting',userController.categorySorting)

user_route.get('/cart',userController.addtoCartPage)
user_route.post('/cart',userController.addtoCartPostMethod) 
user_route.get('/deleteproduct',userController.deleteproduct)

user_route.get('/cartError',userController.loardcartError)

user_route.post('/updateQuatity',userController.updateQuatity)


user_route.get('/address',userController.addAddressPage)
// user_route.post('/address',userController.addAddressPostMethod)

user_route.get('/addNewAddress',userController.userAddNewAddress)
user_route.post('/addNewAddress',userController.userAddNewAddressPostMethod)

user_route.get('/addMoreAddress',userController.userAddMoreAddress)
user_route.post('/addMoreAddress',userController.userAddMoreAddressPostMethod)

user_route.get('/confirmOrder',userController.loadConfirmOrder)
user_route.post('/confirmOrder',userController.confirmOrderPostMethod)

user_route.get('/userProfile',userController.loadUserProfile)

user_route.get('/myProfile',userController.loadMyProfile)
user_route.post('/myProfile',userController.myProfileEdit)
user_route.get('/orderViewProduct',userController.loadOrderViewProduct)

user_route.post('/createOrder',userController.createPaymentOrder)

user_route.get('/canceledOrder',userController.loadcanceledProduct)

user_route.get('/userCoupon',userController.loadUserCoupon)

user_route.post('/checkCouponAvailable',userController.checkCouponAvailable)

user_route.get('/wishlist',userController.loadWishlist)
user_route.post('/wishlist',userController.wishlistPostMethod)

user_route.get('/myWallet',userController.loadwallet)

user_route.post('/checkWalletBalance',userController.checkWalletBalance)

user_route.get('/logout',userController.userLogout);


module.exports=user_route;
