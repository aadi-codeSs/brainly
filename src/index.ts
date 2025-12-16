import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import z from "zod";


const app = express();
app.use(express.json());

app.post("/api/v1/signup", (req, res)=>{

    const requiredBody = z.object({
        username: z.string().min(3).max(10),
        password: z.string().min(8).max(20).regex(/A-Z/).regex(/a-z/).regex(/0-9/).regex(/~!@#$%^&*()_+{}|:"<>?/)
    })

    const parsedDataSuccess = requiredBody.safeParse(req.body);

    if(!parsedDataSuccess.success){
        res.json({
            message: "Incorrect format",
            error: parsedDataSuccess.error
        })
        return
    }

    const username = req.body.username;
    const password = req.body.password;

    
})


app.listen(3000);