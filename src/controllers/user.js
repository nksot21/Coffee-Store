const User = require("../models/user");
const Address = require("../models/address");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const { response } = require("express");
const saltRounds = 10;
const userController = {
  userSignupController: async (req, res) => {
    try {
      console.log(1)
      //check is username available
      const user = await User.findOne({
        where: { Username: req.body.Username },
      });
      console.log(2);

      if (user) {
        console.log(3);
        //username is existing
        res.json("your username is used, please enter another name");
      } else {
      console.log(4);
        //hash password
        const hash = await bcrypt.hash(req.body.Password, saltRounds);

        //create new user and write to database
        const newUser = User.build({
          Username: req.body.Username,
          Password: hash,
          PhoneNumber: req.body.PhoneNumber,
        });
        const responseUser = await newUser.save();
        // create a new Address
        const newAddress = Address.build({
          UserID: responseUser.id,
          Value: req.body.Address,
        });
        const responseAddress = await newAddress.save();

        res.json({
          success: true,
          message: "you have successfully create account",
          data: {
            "userInfo": responseUser,
            "userAddress": responseAddress,
          },
        });
      }
    } catch (e) {
      res.status(404).json(
        {
          "error":e
        }
      );
      //res.send("error", e);
    }
  },
  userLoginController: async (req, res) => {
    try {
      const loginUser = req.body;
      console.log(req.body)
      //check is username existing
      const user = await User.findOne({
        where: { Username: loginUser.Username },
      });

      if (user) {
        //check password
        let isPasswordCorrect = await bcrypt.compare(
          loginUser.Password,
          user.Password
        );

        if (!isPasswordCorrect)
          throw new Error(
            `Password is incorrect, ${loginUser.Password}, ${user.Password}`
          );

        //password correct
        const token = jwt.sign({ id: user._id }, process.env.PRIVATE_KEY, {
          expiresIn: "1h",
        });
        //set jwt to cookie
        res.cookie("jwt", token, { httpOnly: true });

        res.status(200).json({
          message: "login successfully",
          userInfo: {
            Username: user.Username,
            PhoneNumber: user.PhoneNumber,
          },
        });
      }else{
        res.json("user not found",)
      }
    } catch (e) {
      res.json({
        error: e.message,
      });
    }
  },
};

module.exports = userController;
