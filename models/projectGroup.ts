import mongoose from "mongoose";

const ProjectGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ProjectGroup ||
  mongoose.model("ProjectGroup", ProjectGroupSchema);