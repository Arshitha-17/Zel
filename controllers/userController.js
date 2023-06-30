const UserModel = require("../models/userModel");
const config = require("../config/config");
const bcrypt = require("bcrypt");
const Razorpay=require('razorpay')
const razorpayInstance= new Razorpay({
  key_id:config.razorpayKey,
  key_secret:config.razorpaySecret
});


const nodemailer = require("nodemailer");

const randomstring = require("randomstring");

const Product = require("../models/product");
const UserList = require("../models/userModel");
const Category = require("../models/Category");           
const cartModel = require("../models/cart");
const address = require("../models/addressModel");
const addressModel = require("../models/addressModel");
const orderModel=require("../models/order");
const { render } = require("../routes/userRoute");
const couponModel=require('../models/couponModel')
const wishlistModel= require('../models/wishlistModel')
const walletModel=require('../models/wallet');
const { LEGAL_TCP_SOCKET_OPTIONS } = require("mongodb");

const securePassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (error) {
    console.log(error.message);
  }
};

const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });

    const mailOptions = {
      from: "arshithaachu165@gmail.com",
      to: email,
      subject: "For verification mail",
      html:
        "<p> Hii " +
        name +
        ', please click here to <a href="http://zelcakes.shop/verify?id=' +
        user_id +
        '"> verify </a>your mail.</p>',
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been send:- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyMail = async (req, res) => {
  try {
    const updateInfo = await UserList.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );

    res.render("email-verified");
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const email=req.body.email;
    const userInfo=await UserList.findOne({email:email})
    if(userInfo){
      return res.render("registration",{error:"Email Already Exists."});
    }
    if(!userInfo){
       // Generating referral code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    const length = 17;
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }    
    const refCode = req.body.refCode || ''; // Set refCode to an empty string if it doesn't exist
    const userDetails = await UserList.findOne({ referralCode: refCode });    
    let originalRef = '';
    if (userDetails) {
      originalRef = userDetails.referralCode;;
    }    
    const sPassword = await securePassword(req.body.password);
    const userToDatabase = new UserModel({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.mno,
      password: sPassword,
      is_admin: 0,
      referralCode: code,
    });

    const userData = await userToDatabase.save();

    if (userData) {
      // Check if refCode and originalRef match or refCode is empty
      if (refCode === originalRef || !refCode) {
        // Create a wallet for the user
        const walletData = new walletModel({
          userId: userData._id,
          totalRefundAmount: 50,
        });
        const createdWallet = await walletData.save();
        // Credit referral amount to the owner of the referral code
        if (originalRef) {
          const ownerWallet = await walletModel.findOne({ userId: userDetails._id });
          if (ownerWallet) {
            ownerWallet.totalRefundAmount += 50; // Adjust the referral amount as needed
            await ownerWallet.save();
          }
        }
      }
      sendVerifyMail(req.body.name, req.body.email, userData._id);
      // res.render("registration", {
      //   message: "Your registration has been successful.",
      // });
      return res.redirect('/login')
    } else {
      res.render("registration", {
        message: "Your registration has failed.",
      });
    }
    }
  } catch (error) {
    console.log(error.message);
  }
};

// duplicateUser
const duplicateUser=async(req,res)=>{
  try {
    const {email}=req.body
    const duplicate= await UserList.findOne({email:email})
    if(duplicate){
      return res.json({exists:true})
    }
    if(!duplicate){
      return res.json({exists:false})
    }
  } catch (error) {   
    console.log(error.message);
  }
}

const loginPage = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const loginUserVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const is_Match = await UserModel.findOne({ email: email });
    const category = await Category.find({});
    const product = await Product.find({});
  
// pagination
    const ITEMS_PER_PAGE = 8;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await Product.countDocuments();
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    
    const allProducts = await Product.find({}).skip(skipItems)
    .limit(ITEMS_PER_PAGE).populate('category').exec();
    
    if (!is_Match) {
      res.render("login", { message: "No user found" });
      return;
    }
    const passwordMatch = await bcrypt.compare(password, is_Match.password);
    if (!passwordMatch) {
      res.render("login", { message: "Incorrect password" });
    }

    if (is_Match.is_verified === "0") {
      res.render("login", { message: "Not verified" });
      return;
    }
    if (is_Match.is_blocked === true) {
      res.render("login", { message: "Blocked User" });
      return;
    } else {
      req.session.userId = is_Match._id;
      res.render("home", { product: product, category: category,
        currentPage: page,
        totalPages: totalPages });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//reset mail
const resetPasswordEmail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "for reset password",
      html:
        "<p> Hii " +
        name +
        ', please click here to <a href="http://zelcakes.shop/forget?token=' +
        token +
        '"> Reset </a> your password.</p>',
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("email has been sent:- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

//forget password

const forgetPassword = async (req, res) => {
  try {
    res.render("forgetpassword");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const is_Match = await UserModel.findOne({ email: email });
    if (is_Match) {
      if (is_Match.is_verified === 0) {
        res.redirect("forgetpassword", {
          message: "please verified your email",
        });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await UserModel.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        resetPasswordEmail(is_Match.name, is_Match.email, randomString);
        res.render("forgetpassword", {
          message: "please check your mail to reset your password",
        });
      }
    } else {
      res.redirect("forgetpassword", { message: "Your email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forget = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await UserModel.findOne({ token: token });
    if (tokenData) {
      res.render("forget", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "token is invalid." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure_password = await securePassword(password);

    const updatedData = await UserModel.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } }
    );

    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

//send otp with email
const sendOtp = async (name, email, otp) => {
  try {

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "for reset password",
      html: "<p> Hii " + name + " , Your OTP is " + otp + " </p>",
      // html:'<p> Hii '+name+', please click here to <a href="http://127.0.0.1:3000/forget?token='+token+'"> Reset </a> your password.</p>'
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("email has been sent:- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
//log with otp
const logWithOtp = async (req, res) => {
  try {
    res.render("logotp");
  } catch (error) {
    console.log(error.message);
  }
};

const OTPEmailVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const is_Match = await UserModel.findOne({ email: email });
    if (!is_Match) {
      res.render("logotp", { message: "user not found" });
      return;
    }
    if (is_Match.is_verified === 0) {
      res.render("login", { message: "please verify your email" });

      return;
    } else {
      let OTPgenerated = Math.floor(100000 + Math.random() * 900000);
      sendOtp(is_Match.name, is_Match.email, OTPgenerated);
      const OTPAddedToDatabase = await UserModel.updateOne(
        { email: email },
        { $set: { otp: OTPgenerated } }
      );
      const userId = is_Match._id;
      req.session.user_id = userId;
      // res.redirect('/otpverify',{message:'please check your mail'});
      res.redirect("/otpverify");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const OTPFind = async (req, res) => {
  try {

    res.render("otpverify");
    return;
    // const UserEnteredOTP=req.body.otp;
    // const FindUserMyOTP= await UserModel.findOne({otp:UserEnteredOTP});
    // if(FindUserMyOTP){
    //     res.render('otpverify',{user_id:FindUserMyOTP._id});
    //     return;
    // }else{
    //     res.render('404',{message:'otp is invalid.'});
    // }
  } catch (error) {
    console.log(error.message);
  }
};

const OTPpostMethod = async (req, res) => {
  try {

    const otp = req.body.otp;
    const user_id = req.session.user_id;

    const users = await UserModel.findById({ _id: user_id });
    const product = await Product.find({});

    if (users.otp !== otp) {
      res.render("otpverify", { message: "invalid otp" });
      return;
    } else {

      res.render("home", { product: product });
      const updatedData = await UserModel.findByIdAndUpdate(
        { _id: user_id },
        { $set: { otp: otp, otp: "" } }
      );

      return;
    }


  } catch (error) {
    console.log(error.message);
  }
};

const homeLoad = async (req, res) => {
  try {
    const category = await Category.find({});
    let username = req.session.username;
    let session = req.session.loggedIn;

    // pagination
    const ITEMS_PER_PAGE = 8;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    
    let query = {}; // Default query to retrieve all products
    const searchQuery = req.query.search; // Get the search query from the URL query parameters

    if (searchQuery) {
      // If search query exists, update the query to filter products by name
      query = { name: { $regex: searchQuery, $options: 'i' } };
    }

    const totalCount = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    
    const allProducts = await Product.find(query)
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE)
      .populate('category')
      .exec();

    res.render("home", {
      product: allProducts,
      category: category,
      username,
      session,
      currentPage: page,
      totalPages: totalPages,
      searchQuery: searchQuery // Pass the search query to the view for display or further processing if needed
    });
  } catch (error) {
    console.log(error.message);
  }
};

// product detail page
const productDetailPage = async (req, res) => {
  try {
    const category = await Category.find({});

    let productId = req.query.id;
    
    const product = await Product.findOne({ _id: productId });

    const categories= await Category.find({})

    res.render("productDetails", { product,category:category,categories:encodeURIComponent(JSON.stringify(categories)) });
  } catch (error) {
    console.log(error.message);
  }
};

// Category wise sorting

const categorySorting = async (req, res) => {
  try {

    let categoryId = req.query.id;
    const categorys = await Category.findOne({ _id: categoryId });
    const categoryName = categorys.category;
    const category = await Category.find({});

   let products = await Product.find({ category: categoryName }).lean();
   
    res.render("categorySorting", { product:products,category:category});
  } catch (error) {
    console.log(error.message);
  }
};

// add to cart
const addtoCartPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userCartData = await cartModel.findOne({ userid: userId }).populate("product.productId");
    let totalPrice = 0;
    let productPrice;
    if (!userCartData || userCartData.product.length === 0) {
      return res.redirect('/cartError');
    }

    for (const cartItem of userCartData.product) {
      productPrice = cartItem.newPrice * cartItem.quantity;
      totalPrice += productPrice;
    }
    res.render("cart", { userCartData, totalPrice, productPrice });
  } catch (error) {
    console.log(error.message);
  }
};


const addtoCartPostMethod = async (req, res) => {
  try {

    const userId = req.session.userId;
    const { productId,price } = req.body;

    const cart = await cartModel.findOne({ userid: userId });

    if (cart) {
      const existingProduct = cart.product.some(
        (product) => product.productId.toString() === productId
      );
      if (existingProduct) {
  
        return;
      }
      cart.product.push({ productId: productId ,newPrice:price});
      await cart.save();
    } else {

      const newCart = new cartModel({
        userid: userId,
        product: [
          {
            productId: productId,
            newPrice:price
          },
        ],
      });
      await newCart.save();
    }

       // Remove products from the wishlist
       const removeWish=await wishlistModel.updateOne(
        { userId: userId },
        { $pull: { product: { product_id: { $in: productId } } } }
      );
 

  } catch (error) {
    console.log(error.message);
  }
};

// delete
const deleteproduct=async(req,res)=>{
  
  try {
    const userId = req.session.userId;
    const productId = req.query.deleteId

    const cartvalue=await cartModel.findOne({userid:userId})
      const cart = await cartModel.updateOne(
        { userid: userId },
        { $pull: { product: { productId: productId } } }
      );
      return res.redirect("/cart")
    } catch (error) {
      console.log(error);
    }
    
}

// cart error
const loardcartError=async(req,res)=>{
  try {
    const category = await Category.find();
    res.render('cartError',{category})
  } catch (error) {
    console.log(error.message);
  }
}

const updateQuatity = async (req, res) => {
  try {
    const userId = req.session.userId;
    let { productId, newQuantity } = req.body;
 // Check the value of newQuantity
    let quantity = parseInt(newQuantity) // Check the parsed quantity value
    if (isNaN(quantity)) {
      throw new Error("Invalid quantity value");
    }
    if (quantity < 1) {
      const filter = { userid: userId };
      const update = { $pull: { product: { productId: productId } } };
      const deleteFromCart = await cartModel.updateOne(filter, update);
      res.send({ redirect: "/cart" });
      return;
    }
    const cart = await cartModel.findOne({ userid: userId });
    const quantityUpdate = await cartModel.updateOne(
      { userid: userId, "product.productId": productId },
      { $set: { "product.$.quantity": quantity } }
    );
   if (quantityUpdate.modifiedCount == 1) {
      res.send({ redirect: "/cart" });
      return;
    }
  } catch (error) {
    console.log(error.message);
  }
};

// add address page
const addAddressPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    let total=req.query.total;
    
    // cat offer
    const userCartData = await cartModel.findOne({ userid: userId }).populate("product.productId")

    let totalPrice = 0;
    let productIds = userCartData.product.map((cartItem) => cartItem.productId._id);
    let  productPrice;
   let products= await Product.findOne({_id:productIds})
   let productCategory=products.category
   let productQuantity;
   //category offer
   
   if (userCartData && userCartData.product && userCartData.product.length > 0) {
     for (const cartItem of userCartData.product) {
       const product = cartItem.productId;
       productQuantity=cartItem.quantity;
      }
    }

    const categories= await Category.findOne({category:productCategory})
    categoryOffer=categories.categoryOffer
    let totalCategoryofferAmount=categoryOffer*productQuantity
    const category = await Category.find({});
    const currentCart = await cartModel.findOne({ userid: userId });
    const currentAddress = await addressModel.find({ userid: userId });  
    if (currentAddress) {
      res.render("address", {
        currentAddress: currentAddress,
        currentCart: currentCart,total,category,
        categoryOffer:encodeURIComponent(JSON.stringify(totalCategoryofferAmount))
      });
    } else {
      res.render("addNewAddress");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userAddNewAddress = async (req, res) => {
  try {
    res.render("addNewAddress");
  } catch (error) {
    console.log(error.message);
  }
};

const userAddNewAddressPostMethod = async (req, res) => {
  try {
    const userId = req.session.userId;
    const {name,phone,address,state}=req.body

    const addAddress = new addressModel({
      userid: userId,
      name:name,
      phone:phone,
      address:address,
      state:state
    
      
    });
    await addAddress.save();
  } catch (error) {
    console.log(error.message);
  }
};

const userAddMoreAddress = async (req, res) => {
  try {
    res.render("addMoreAddress");
  } catch (error) {
    console.log(error.message);
  }
};

const userAddMoreAddressPostMethod = async (req, res) => {
  const { address, name, phone, state } = req.body;
  const userId = req.session.userId;
  const newAddress = new addressModel({
    userid: userId,
    name:name,
    phone:phone,
    address:address,
    state:state
  });
  await newAddress.save();
console.log(newAddress);
};

//Confirm order

const loadConfirmOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    res.render("confirmOrder");
  } catch (error) {
    console.log(error.message);
  }
};

const confirmOrderPostMethod = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { addressForDelivery, payment } = req.body;
    const currentAddress = await addressModel.find({ userid: userId });
    const matchingAddress = currentAddress.find(
      (address) => address._id.toString() === addressForDelivery
    );


    const userCartData = await cartModel.findOne({ userid: userId }).populate("product.productId")
    let totalPrice = 0;
    let productIds = userCartData.product.map((cartItem) => cartItem.productId._id);
    let  productPrice;
   let productts= await Product.findOne({_id:productIds})
   let productCategory=productts.category
     //category offer
   const category= await Category.findOne({category:productCategory})
   categoryOffer=category.categoryOffer
    // coupon
    const couponCode= req.body.couponCode || '';
    let couponAvailable;
    let subtotal = 0;
    let currentAmount=0;
    let currentdate = new Date();
    if(couponCode){
      couponAvailable=await couponModel.findOne({couponName:couponCode})
      
          if (userCartData && userCartData.product && userCartData.product.length > 0) {
              for (const cartItem of userCartData.product) {
                  const product = cartItem.productId;
                  const productPrice =  (cartItem.newPrice) * cartItem.quantity;
                  subtotal += productPrice;
                }
    
                let couponValue = couponAvailable.couponAmount;
                subtotal = subtotal - couponValue
            }
    }
    const cart = await cartModel.findOne({ userid: userId });
    const productIdOnly = cart.product.map((item) => item.productId);
    const user = await addressModel.findOne({ userid: userId.toString() });
    const products = await Product.find({ _id: { $in: productIdOnly } });
    const priceMap = new Map();
    products.forEach((product) => {
      priceMap.set(product._id.toString(), product.price);
    });
 
    // Calculate the total amount and total quantity
    let totalAmount = 0;
    let totalQuantity = 0;
    const orderProducts = cart.product.map((product) => {
     
      const productId = product.productId;
     
      const quantity = product.quantity;
    
      const productPrice = priceMap.get(productId.toString());
     
      const productTotal = productPrice * quantity;
     
      totalAmount += (productTotal -categoryOffer);
      totalQuantity += quantity;
    
      return {
        product_id: productId,
        quantity: quantity,
        total: productTotal,
      };
    });
 

    const currentDate = new Date();
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(currentDate.getDate() + 3);

    let couponCoded;
    let orderCount=0;
    if(couponAvailable){
      couponAvailable.couponName
      couponCoded= couponAvailable.couponName ? couponAvailable.couponName:"not available";

    }
    
    if(totalAmount || subtotal){
      orderCount=totalAmount? totalAmount:subtotal
    }


    const newOrder = new orderModel({
      userId: userId,
      product: orderProducts,
      total: subtotal?subtotal:totalAmount,
      coupon:  couponCoded, // Fill this with the coupon value if applicable
      paymentMethod: payment,
      status: "Pending",
      address: matchingAddress,
      orderDate: currentDate,
      itemquantity: totalQuantity,
      expectedDeliveryDate: expectedDeliveryDate,
    });

    const savedOrder = await newOrder.save();

    // Update the stock count of products
    cart.product.forEach(async (product) => {
      const productId = product.productId;
      const quantity = product.quantity;

      // Find the product by ID
      const foundProduct = await Product.findById(productId);
   
      // Calculate the new stock count
      const newStock = parseInt(foundProduct.stock) - parseInt(quantity);

      // Update the stock count in the database
      await Product.findByIdAndUpdate(productId, { stock: newStock });
    });

    // Remove products from the cart
    await cartModel.updateOne(
      { userid: userId },
      { $pull: { product: { productId: { $in: productIdOnly } } } }
    );

    const wallet = await walletModel.findOne({ userId });

    if (payment === "Wallet" && wallet.totalRefundAmount >= orderCount) {
      // Decrease wallet amount
      const newWalletAmount = wallet.totalRefundAmount - orderCount;
      const updateWallet= await walletModel.findOneAndUpdate({ userId }, { totalRefundAmount: newWalletAmount });

    }

    res.render("confirmOrder", {
      currentCart: cart,
      matchingAddress,
      totalAmount,
      subtotal,
      savedOrder,
      products,
      totalQuantity,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//user Profile
const loadUserProfile = async (req, res) => {
  try {
    const category = await Category.find({});
    const userId = req.session.userId;
    const userDetails = await UserList.findOne({ _id: userId });
    const userorder = await orderModel.find({ userId: userId });

    // Sorting options
    const sortByLatest = req.query.sort === 'latest'; // Check if the sort query parameter is 'latest'
    let sortedOrders = [...userorder]; // Create a copy of the user orders array

    if (sortByLatest) {
      sortedOrders.sort((a, b) => b.orderDate - a.orderDate); // Sort by latest order first
    } else {
      sortedOrders.sort((a, b) => a.orderDate - b.orderDate); // Sort by oldest order first
    }

    const cart = await cartModel.findOne({ userid: userId });
    const orderProducts = await orderModel
      .find({ userId: userId })
      .populate('product.product_id', 'product_id');

    let users = await UserList.findOne({ _id: userId });
    let code = users.referralCode;

    res.render('userProfile', {
      category,
      userDetails,
      userorder: sortedOrders, // Use the sortedOrders array in the template
      cart,
      code,
    });
  } catch (error) {
    console.log(error.message);
  }
};



//my profile editing
const loadMyProfile=async(req,res)=>{
  try {
    const userId = req.session.userId;
    const userDetails=await UserList.findOne({_id:userId})
    res.render('myProfile',{userDetails})
  } catch (error) {
    console.log(error.message);
  }
}

const myProfileEdit = async (req, res) => {
  const { name, phone, email } = req.body;
  const userId = req.session.userId;

  try {
    const updatedUserDataField = await UserList.findOneAndUpdate(
      { _id: userId },
      { name: name, phone: phone, email: email },
      { new: true }
    );

    console.log("User data updated:", updatedUserDataField);
    // Send response or redirect to another page
    res.redirect("/userProfile");
  } catch (error) {
    console.error("Error updating user data:", error);
    // Send error response or redirect to an error page
    res.status(500).send("Error updating user data");
  }
};

// view oder product
const loadOrderViewProduct = async (req, res) => {
  try {
    const userId = req.session.userId;
    const orderProducts = await orderModel
  .find({ userId: userId })
  .populate('product.product_id', 'product_id');
  const productID=orderProducts.map(order => order.product.map(p => p.product_id))
  // Flatten the productID array
  const flattenedProductID = [].concat(...productID);
  // Find product names using the product IDs
  const productDetails = await Product.find({ _id: { $in: flattenedProductID } });
  const order = await orderModel.findOne({ userId: userId });
    res.render('orderViewProduct', {productDetails,order});
  } catch (error) {
    console.log(error.message);
  }
};

//Payment
const createPaymentOrder = async (req, res) => {
  try {
    let couponCode=req.body.couponCode
    let couponAmount=0;
    if(couponCode){
      let couponAmounts= await couponModel.findOne({couponName:couponCode})
      couponAmount=couponAmounts.couponAmount
        const amount = (req.body.total-couponAmount)* 100 ; // Multiply by 100 to convert to paise
        const options = {
          amount: amount,
          currency: 'INR',
          receipt: 'arshithaachu165@gmail.com',
        };
    
        razorpayInstance.orders.create(options, async (err, order) => {
          if (!err) {
            res.status(200).send({
              success: true,
              msg: 'Order Created',
              order_id: order.id,
              amount: amount,
              key_id: 'rzp_test_x9w0KDyJ4nuAAj',
              name: req.body.name,
              email: req.body.email,
              mobile: req.body.phone,
            });
          } else {
            res.status(400).send({ success: false, msg: 'Something went wrong' });
          }
        });
    
    }else{
      const amount = req.body.total* 100 ; 
      const options = {
        amount: amount,
        currency: 'INR',
        receipt: 'arshithaachu165@gmail.com',
      };
  
      razorpayInstance.orders.create(options, async (err, order) => {
        if (!err) {
          res.status(200).send({
            success: true,
            msg: 'Order Created',
            order_id: order.id,
            amount: amount,
            key_id: 'rzp_test_x9w0KDyJ4nuAAj',
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.phone,
          });
        } else {
          res.status(400).send({ success: false, msg: 'Something went wrong' });
        }
      });
  
    }
       
    
  } catch (error) {
    console.log(error.message);
  }
};

// Cancel Order
const loadcanceledProduct=async(req,res)=>{
  try {
    const orderId=req.query.id;
  
    const filter= {_id:orderId}
    const update={status:'Cancelled'}
    const userId=req.session.userId;
    const orders= await orderModel.findOneAndUpdate({_id:orderId},{status:'Cancelled'});
    const order=await orderModel.findOne({_id:orders._id})
    if(order.paymentMethod==='Net Banking' || order.paymentMethod==='Wallet' && order.status==="Cancelled"){
      const wallet=await walletModel.findOne({userId:order.userId});
      if(!wallet){
        const newWallet= new walletModel({
          userId:order.userId,
          totalRefundAmount:order.total,
          cancel:[
            {
              orderId: order._id,
              cancelAmount:order.total,
              refundDate:Date.now()
            }
          ]
        });
        const savedWallet= await newWallet.save();
      }else{
        const existingCancel= wallet.cancel.find(
          (cancel)=>cancel.orderId.toString()===orderId
        );
        if(existingCancel){
        }else{
          wallet.cancel.push({
            orderId: order._id,
            cancelAmount:order.total,
            refundDate:Date.now()

          });
          wallet.totalRefundAmount+=order.total;
          const savedWallet=await wallet.save();
        }
      }
    }


    
    return res.redirect('/userProfile')

    // res.render('canceledOrder')

  } catch (error) {
    console.log(error.message);
  }
}

// coupon start
const loadUserCoupon=async(req,res)=>{
  try {
    const category = await Category.find({});
    const coupon= await couponModel.find()
    res.render('userCoupon',{category,coupon})
  } catch (error) {
    console.log(error.message);
  }

}

const checkCouponAvailable = async (req, res) => {
  try {
    const userId=req.session.userId
    const code = req.body.code;
    const coupon = await couponModel.findOne({ couponName: { $regex: new RegExp('^' + code + '$', 'i') } });
    const currentDate = new Date(); // Get the current date and time
    // const currentDate=date.toISOString();

    const userCartData = await cartModel.findOne({ userid: userId }).populate("product.productId")
    let totalPrice = 0;
    if (userCartData && userCartData.product && userCartData.product.length > 0) {
        for (const cartItem of userCartData.product) {
            const product = cartItem.productId;
            const productPrice = cartItem.newPrice* cartItem.quantity;
            totalPrice += productPrice;
        }
    }
    
   const couponAmount=coupon.couponAmount;

    let subtotal=0;
    if(code===coupon.couponName && currentDate<coupon.couponExprireDate && totalPrice>=coupon.minimumAmount ){
      subtotal=totalPrice-coupon.couponAmount;
    }
    
    if (subtotal !== 0) {
      res.json({ available: true, subtotal: subtotal ,couponAmounts:couponAmount}); // Coupon is available, send subtotal in the response
    } else {
      res.json({ available: false }); // Coupon is not available
    }



  } catch (error) {
    console.log(error.message);
  }
};

// wishlist
const loadWishlist=async(req,res)=>{
  try {
    const userId = req.session.userId;
    const wishlist=await wishlistModel.findOne({userId:userId}).populate('product.product_id')
    const category = await Category.find({});
    res.render('wishlist',{category,wishlist})
  } catch (error) {
    console.log(error.message);
  }
}

const wishlistPostMethod = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.body;
    const filter = { userId: userId };
    const userIs = await wishlistModel.findOne(filter).then((wishlist) => {
      if (!wishlist) {
        const newWishlist = new wishlistModel({
          userId,
          product: [{ product_id: productId }] // Corrected field name
        });
        return newWishlist.save();
      } else {
        const isProductExist = wishlist.product.some((item) => {
          return item.product_id.toString() === productId.toString();
        });
        if (!isProductExist) {
          wishlist.product.push({ product_id: productId });
          return wishlist.save();
        } else {
          throw new Error('Product already exists');
        }
      }
    }).then((updatedwishlist) => {
      return res.json({ updatedwishlist });
    });
   
  } catch (error) {
    console.log(error.message);
  }
};

// Wallet
const loadwallet = async (req, res) => {
  try {

    const userId = req.session.userId;
    const category = await Category.find({});
    const wallet = await walletModel.findOne({ userId: userId }).populate('cancel.orderId').exec();
    if (!wallet) {
      return res.render('myWallet', { category, wallet: null, totalRefundAmount: null });
    }
    const totalRefundAmount= wallet.totalRefundAmount
    const amountUpdate = await walletModel.updateOne(
      { userId: userId},
      { $set: { "totalRefundAmount": totalRefundAmount } }
    );
    const amount=await walletModel.findOne({userId})
    // Retrieve the product details for each cancelled order
    for (const cancel of wallet.cancel) {
      if (cancel.orderId) {
        const order = await orderModel.findById(cancel.orderId);
        if (order) {
          const product = await Product.findById(order.product[0].product_id);
          if (product) {
            cancel.orderId.product = product;
          }
        }
      }
    }
    res.render('myWallet', { category, wallet, totalRefundAmount });
  } catch (error) {
    console.log(error.message);
  }
};

// checkWalletBalances
const checkWalletBalance = async (req, res) => {
  try {
    const userId = req.session.userId;
    const wallet = await walletModel.findOne({ userId });
    const walletTotalAmount= wallet.totalRefundAmount
    if (wallet) {
      const cartTotal = parseFloat(req.body.total);

      if (walletTotalAmount >= cartTotal) {
        // Wallet has sufficient balance
        res.json({ sufficientBalance: true });
      } else {
        // Wallet balance is insufficient
        res.json({ sufficientBalance: false, errorMessage: "Insufficient Balance. Please add funds to your wallet." });
      }
    } else {
      // Wallet not found for the user
      res.json({ error: "Wallet not found for the user." });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: "An error occurred while checking the wallet balance." });
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  homeLoad,

  loadRegister,
  insertUser,
  duplicateUser,
  loginPage,
  loginUserVerify,
  forgetPassword,
  forgetVerify,
  forget,
  resetPassword,
  OTPFind,
  OTPpostMethod,
  logWithOtp,
  OTPEmailVerify,
  userLogout,
  verifyMail,
  productDetailPage,
  categorySorting,
  addtoCartPostMethod,
  deleteproduct,
  updateQuatity,
  addtoCartPage,
  loardcartError,
  addAddressPage,
  userAddNewAddress,
  userAddNewAddressPostMethod,
  userAddMoreAddress,
  userAddMoreAddressPostMethod,
  loadConfirmOrder,
  confirmOrderPostMethod,
  loadUserProfile,
  loadMyProfile,
  myProfileEdit,
  loadOrderViewProduct,
  createPaymentOrder,
  loadUserCoupon,
  checkCouponAvailable,
  loadWishlist,
  wishlistPostMethod,
  loadwallet,
  checkWalletBalance,
  loadcanceledProduct,
};
