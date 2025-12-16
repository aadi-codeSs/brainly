import mongoose, { Types } from "mongoose";
import { required } from "zod/v4/core/util.cjs";

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const UserSchema = new Schema({
    username: {type: String,required: true, unique: true},
    password: {type: String, required: true}
});

const TagSchema = new Schema({
    tag: {type: String,required: true, unique: true},
});

const typesArray = ["image", "video", "article", "audio"];

const User = mongoose.model("user", UserSchema);
const Tag = mongoose.model("tag", TagSchema);

const ContentSchema = new Schema({
    link: {type: String, required: true},
    title: {type: String, required: true},
    type: {type: String, required: true, enum: typesArray},
    tag: [{type: Types.ObjectId, ref: Tag}],
    contentId: {type: Types.ObjectId, ref: User, required: true}
});

const linkSchema = new Schema({
    hash: {type: String, required: true},
    userid: {type: Types.ObjectId, ref: User, required: true}
});

