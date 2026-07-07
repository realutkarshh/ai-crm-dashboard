import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type:String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'email is required'],
            trim: true,
            unique: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
        },
        password: {
            type: String,
            required: [true, 'password is required'],
            minLength: [6, 'The password should be atleast 6 characters long'],
            select: false
        },
        role: {
            type: String,
            enum: ['owner','member'],
            default: 'owner',
        },
        company: {type: String, trim: true, default: ""},
        avatar: {type: String, default:""}
        
    },
    {timestamps: true}
)

userSchema.pre("save", async function (next) {
    if(!this.isModified('password')) return next()
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next();
});

//Creating a custom matchPassword method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);