import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import z from "zod";
import { UserModel, TagModel, ContentModel, LinkModel } from "./db.js";
import { JWT_SECRET } from "./config.js";
import { AuthMiddleware } from "./middleware.js";
import { randomString } from "./utlilis.js";
import cors from "cors";

mongoose.connect("mongodb+srv://adityasingh0999_db_user:8HmOOlVSjUgLCy0N@projects.jg9tssk.mongodb.net/brainly")

const app = express();
app.use(express.json());
app.use(cors());

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
    const {link, title, type, description} = req.body;

    await ContentModel.create({
        link: link,
        title: title,
        description: description,
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
    }).select("link title type tag _id description");

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
    const userId = req.userId;

    if (!contentId || typeof contentId !== "string") {
        res.status(400).json({ message: "contentId (string) is required" });
        return;
    }

    if (!userId || typeof userId !== "string") {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const contentObjectId = new mongoose.Types.ObjectId(contentId.trim());
        const userObjectId = new mongoose.Types.ObjectId(userId.trim());

        // Delete the specific document and ensure it belongs to the requesting user (contentId is the owner field in the schema)
        const result = await ContentModel.deleteOne({
            _id: contentObjectId,
            contentId: userObjectId
        });

        if (!result || (result as any).deletedCount === 0) {
            return res.status(404).json({
                message: "Content not found or you don't represent the owner"
            });
        }

        res.json({
            message: "Successfully deleted the content"
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Internal server error"
        });
    }
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