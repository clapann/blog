import { connectToDatabase } from "@/lib/mongoose";
import mongoose, { Schema, models, model } from "mongoose";

export interface PasskeyDoc extends mongoose.Document {
	userId: string;
	credentialId: string;
	publicKey: Buffer;
	counter: number;
	transports?: string[];
	createdAt: Date;
	updatedAt: Date;
}

const PasskeySchema = new Schema<PasskeyDoc>({
	userId: { type: String, required: true, unique: true },
	credentialId: { type: String, required: true, unique: true },
	publicKey: { type: Buffer, required: true },
	counter: { type: Number, required: true },
	transports: [{ type: String }]
}, { timestamps: true, collection: "passkey" });

export async function getPasskeyModel() {
	await connectToDatabase();
	return (models.Passkey as mongoose.Model<PasskeyDoc>) || model<PasskeyDoc>("Passkey", PasskeySchema);
}