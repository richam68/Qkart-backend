const mongoose = require('mongoose');
const { productSchema } = require('./product.model');
const config = require("../config/config");
// const { isInteger } = require('core-js/core/number');

// TODO: CRIO_TASK_MODULE_CART - Complete cartSchema, a Mongoose schema for "carts" collection
const cartSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, 
    },
      cartItems:
      // {
      // type: [{product: productSchema,quantity: Number}]},
       [{
      product:  productSchema ,
      quantity:  Number 
    }],
    paymentOption: {
      type: String,
      default: config.default_payment_option
    }
  },
  {
    timestamps: false,
  }
);


/**
 * @typedef Cart
 */
const Cart = mongoose.model('Cart', cartSchema);

module.exports.Cart = Cart;