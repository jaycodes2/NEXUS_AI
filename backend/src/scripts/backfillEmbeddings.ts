import mongoose from "mongoose";
import dotenv from "dotenv";
import { History } from "../models/historyModels.js";
import { generateEmbedding } from "../utils/embedding.gemini.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;

async function backfill() {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const cursor = History.find({
        $or: [
            { promptEmbedding: { $exists: false } },
            { replyEmbedding: { $exists: false } }
        ]
    }).cursor();

    let count = 0;

    for await (const doc of cursor) {
        const promptEmbedding = await generateEmbedding(doc.prompt);
        const replyEmbedding = await generateEmbedding(doc.reply);

        doc.promptEmbedding = promptEmbedding;
        doc.replyEmbedding = replyEmbedding;

        await doc.save();
        count++;
        console.log(`Backfilled ${count}`);
    }

    console.log("Backfill complete");
    process.exit(0);
}

backfill().catch(err => {
    console.error(err);
    process.exit(1);
});
