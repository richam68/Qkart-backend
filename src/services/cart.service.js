const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  return cart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
async function addProductToCart(user, productId, quantity) {
    //check item is present in cart
    let cart = await Cart.findOne({email: user.email});

      //item not exists in cart then create
    if(!cart){
      try{
      cart = await Cart.create({
        email: user.email,
        cartItems: [],
        paymentOption: config.default_payment_option
      });
      await cart.save();

    }catch(err){
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "User cart creation failed")
    }
    }

    if(!cart)  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Cart creation failed');
    
  //if product already in user's cart
  // console.log(cart.cartItems);
  if(cart.cartItems.some((item) => item.product._id == productId)){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product already in cart. Use the cart sidebar to update or remove product from cart")
  }

  //trying to add product but not present in product collection
  const product = await Product.findOne({_id: productId});
  if(!product){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database")
  };
  cart.cartItems.push({ product, quantity });
  await cart.save()

  return cart
}

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  //get user's cart
  const cart = await Cart.findOne({ email: user.email });
  //if cart doesn't exsist
  if(!cart){
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart. Use POST to create cart and add a product")
  }

  let product = await Product.findOne({_id: productId});
  //if product is not present in product model
  if(!product){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database")
  };

  //product index in cartitems
  let productIndex = cart.cartItems.findIndex((item) => item.product._id == productId);

  //If product to update not in user's cart
  if(productIndex === -1){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart")
  }

  // let { quantity } = update
  // let updateCart = await Product.findOneAndUpdate({_id:productId, update, {new: true}})
  cart.cartItems[productIndex].quantity = quantity
  await cart.save()
  return cart;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const cart = await Cart.findOne({email: user.email});
  if(!cart){
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart")
  }
  let productIndex = cart.cartItems.findIndex((item) => item.product._id == productId);

  //If product to update not in user's cart
  if(productIndex === -1){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart")
  }
  cart.cartItems.splice(productIndex, 1);
  await cart.save()
};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
 
  // console.log("user >>", user)
 const cart = await Cart.findOne({ email: user.email});
// console.log("cart", cart)
  //nothing is present in cart
  if(cart == null){
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart" )
  }

  //check in checkout page items is present or not
  if(cart.cartItems.length == 0){
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have item in cart")
  }

 //to check if an address is set or not using method : hasSetNonDefaultAddress()
//  const hasSetNonDefaultAddress = await user.hasSetNonDefaultAddress()
//  if(!hasSetNonDefaultAddress){
//   throw new ApiError(httpStatus.BAD_REQUEST, "Address is not set")
//  }
if(!(await user.hasSetNonDefaultAddress())){
  throw new ApiError(httpStatus.BAD_REQUEST, "Address is not set")
}

  //when you doesn't have sufficient balance but attempting to buy
  let total = cart.cartItems.reduce((accumulator, item) => {
    accumulator +=  item.product.cost * item.quantity;
    return accumulator
  }, 0);

  if(total > user.walletMoney){
    throw new ApiError(httpStatus.BAD_REQUEST, "User balance is not sufficient")
  }

 //to check if wallet balance was decremented on a successful checkout
  user.walletMoney = user.walletMoney - total
  await user.save();

  // when all items become empty after checkout, this item our cart has no item
  cart.cartItems = [];
  await cart.save();
console.log("cart", cart)
  return cart
};
// const checkout = async (user) => {
//   const userCart = await Cart.findOne({ email: user.email });
//   if (!userCart) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
//   }
//   if (userCart.cartItems.length === 0) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User cart is empty");
//   }
  
//   if (!(await user.hasSetNonDefaultAddress())) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Address is not set");
//   }

//   let totalCost = 0;
//   userCart.cartItems.forEach((item) => {totalCost += item.product.cost * item.quantity});
 
//   if (user.walletMoney < totalCost) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Wallet Balance is Insufficient");
//   }

//   userCart.cartItems = [];
//   user.walletMoney -= totalCost;
//   user.save();
//   userCart.save();
//   return userCart;
// };


module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
