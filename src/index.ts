import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import z from "zod";
import { UserModel, TagModel, ContentModel, LinkModel } from "./db.js";
import { JWT_SECRET } from "./config.js";
import { AuthMiddleware } from "./middleware.js";
import { core } from "zod";
import { randomString } from "./utlilis.js";


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

app.get("/api/v1/content", AuthMiddleware, async (req, res) => {
    const contentId = new mongoose.Types.ObjectId(req.userId);

    const contentArray = await ContentModel.find({
        contentId: contentId
    }).select("link title type tag -_id");

    if(contentArray){
        res.json({
            contentArray
        })
    }
    else{
        res.status(404).json({
            message: "No content uploaded by user"
        })
    }
})

app.delete("/api/v1/content", AuthMiddleware, async (req, res) => {
    const contentId = req.body.contentId;

    try{
     await ContentModel.deleteMany({contentId, userId: req.userId})
    }
    catch(e){
        res.status(404).json({
            message: "unable to delete"
        })
        return
    }

    res.json({
        message: "successfully deleted the content"
    })
})

app.post("/api/v1/brain/share", AuthMiddleware, async (req, res) => {
    const { share } = req.body;
    const userIdFetched = new mongoose.Types.ObjectId(req.userId);
    if( share ){
        const existingLink = await LinkModel.findOne({
            userId: userIdFetched
        })
    if(existingLink){
        res.json({ hash: existingLink.hash });
        return
    }

    const hash = randomString(10);
    await LinkModel.create( { userId: userIdFetched, hash} );
    res.json({ hash });

    }
    else{
        await LinkModel.deleteOne({
            userId: userIdFetched
        })
        res.json({
            message: "Shareable link removed"
        })
    }
})

app.get("/api/v1/brain/sharedLink", AuthMiddleware, async (req, res) => {
    const sharedLink = req.params.sharedLink;

    const link = await LinkModel.findOne({
       sharedLink
    })
    if(!link){
        res.status(404).json({
            message: "Invalid Link"
        })
        return
    }
    else{
        const content = await ContentModel.find({
            contentId: link.userId
        }).select(" link title type tag ")
        const user = await UserModel.findById(link.userId)

        if(!user){
            res.status(404).json({
                message: "user doesnt exist"
            })  
            return 
        }
        res.json({
                username: user.username,
                content
            })
    }
})

app.listen(3000);