import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import z from "zod";
import { UserModel, TagModel, ContentModel, LinkModel } from "./db.js";
import { JWT_SECRET } from "./config.js";
import { AuthMiddleware } from "./middleware.js";

mongoose.connect("mongodb+srv://adityasingh0999_db_user:8HmOOlVSjUgLCy0N@projects.jg9tssk.mongodb.net/brainly")

const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {

    const requiredBody = z.object({
        username: z.string().min(3).max(10),
        password: z.string().min(8).max(20).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[~!@#$%^&*()_+{}|:"<>?]/)
    })

    const parsedDataSuccess = requiredBody.safeParse(req.body);

    if (!parsedDataSuccess.success) {
        res.status(411).json({
            message: "Incorrect format",
            error: parsedDataSuccess.error
        })
        return
    }

    const username = req.body.username;
    const password = req.body.password;

    let checkDuplicate = false;

    try {

        const hashedPassword = await bcrypt.hash(password, 5);

        await UserModel.create({
            username: username,
            password: hashedPassword
        })
    }
    catch (e) {
        res.status(403).json({
            message: "user already exists"
        });

        checkDuplicate = true;
    }

    if (!checkDuplicate) {
        res.status(200).json({
            message: "User signed up"
        })
    }
});

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.username;

    const user = await UserModel.findOne({
        username: username
    })
    //@ts-ignore
    const passwordMatch = await bcrypt.compare( password, user.password);

    if(!user){
        res.status(403).json({
            message: "Wrong credintials"
        })
    }
    else{
        const token = jwt.sign({ id: user._id.toString()}, JWT_SECRET);
        res.status(200).json({
            token: token
        })
    }
})

app.post("/api/v1/content", AuthMiddleware, async (req, res) => {
    const {link, title, type} = req.body;

    await ContentModel.create({
        link: link,
        title: title,
        type: type,
        contentId: new mongoose.Types.ObjectId(req.userId),
        tag: [],
    })

    res.status(200).json({
        message: "Content added"
    })
})



app.listen(3000);