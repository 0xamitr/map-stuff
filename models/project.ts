// models/Project.ts
import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  name: String,
  geojson: {
    type: Object,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["high speed rail", "expressway", "metros"],
  },
  status: {
    type: String,
    required: true,
    enum: ["u/c", "proposed", "completed"],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);