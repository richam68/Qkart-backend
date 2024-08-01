const express = require("express");
const validate = require("../../middlewares/validate");
const authValidation = require("../../validations/auth.validation");
const authController = require("../../controllers/auth.controller");

const router = express.Router();
const registerMiddleware = validate(authValidation.register);
const loginMiddleware = validate(authValidation.login)
// TODO: CRIO_TASK_MODULE_AUTH - Implement "/v1/auth/register" and "/v1/auth/login" routes with request validation

router.post("/register", registerMiddleware, authController.register);
router.post("/login", loginMiddleware, authController.login)

module.exports = router; 
