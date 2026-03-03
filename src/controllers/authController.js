const user = require('../models/UserModel');


const registerUser = async (req , res) => {
    try {
        
        const { name , email , password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message:"All fields are required" });
        }

        const userExists = await user.findOne({ email });
        
        if (userExists) {
            return res.status(400).json({ message:"User already exists "});
        }


        const createUser = await user.create({
            name,
            email,
            password
        });

        res.status(201).json({
            message:"User registered successfully",
            user:{
                id: createUser._id,
                name: createUser.name,
                email: createUser.email,
            },
        });
        console.log("User registered");
        console.log('Name: ', name);
        console.log('Email: ', email)

    } catch (error) {
        res.status(500).json({ message: "Server error",error });
    }
}

module.exports = { registerUser }