import type { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "./config.js";
import  jwt  from "jsonwebtoken";

const AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];

    if(!header){
        res.status(401).json({ message: "Missing authorization header" });
        return;
    }

    try {
        const verification = jwt.verify(header as string, JWT_SECRET) as any;

        if (verification && verification.id) {
            req.userId = verification.id;
            next();
        } else {
            res.status(401).json({ message: "Invalid token" });
        }
    } catch (e) {
        res.status(401).json({ message: "Invalid token" });
    }
}

export {AuthMiddleware};