import mongoose, { Types } from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = Types.ObjectId;

const UserSchema = new Schema({
    username: {type: String,required: true, unique: true},
    password: {type: String, required: true}
});

const TagSchema = new Schema({
    tag: {type: String,required: true, unique: true},
});

const typesArray = ["image", "video", "article", "audio"];

const UserModel = mongoose.model("user", UserSchema);
const TagModel = mongoose.model("tag", TagSchema);

const ContentSchema = new Schema({
    link: {type: String, required: true},
    title: {type: String, required: true},
    type: {type: String, required: true, enum: typesArray},
    tag: [{type: Types.ObjectId, ref: TagModel}],
    contentId: {type: mongoose.Types.ObjectId, ref: "user", required: true}
});

const linkSchema = new Schema({
    hash: {type: String, required: true},
    userId: {type: Types.ObjectId, ref: "user", required: true}
});

const ContentModel = mongoose.model("content", ContentSchema);
const LinkModel = mongoose.model("links", linkSchema);

export {UserModel, TagModel, ContentModel, LinkModel};