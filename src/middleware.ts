import type { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "./config.js";
import  jwt  from "jsonwebtoken";

const AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];

    const verification = jwt.verify( header as string, JWT_SECRET );

    if(verification){
        //@ts-ignore
        req.userId = verification.id;
        next();
    }
    else{
        res.json({
            message: "Invalid request"
        })
    }
}

export {AuthMiddleware};