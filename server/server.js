const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

require("dotenv").config();

const User = require("./models/User");
const Post = require("./models/Post");
const Project = require("./models/Project");
const Snippet = require("./models/Snippet");
const Message = require("./models/Message");
const CodeRoom = require("./models/CodeRoom");
const Job = require("./models/Job");
const Notification = require("./models/Notification");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors({ origin: "*" }));
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  dest: "uploads/",
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/api/test-ai", (req, res) => {
  res.json({ message: "Free AI route working" });
});

/* AUTH */

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const username =
      name.toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 1000);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
    });

    res.json({
      message: "User Saved",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error saving user",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

/* USERS */

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching users",
    });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching profile",
    });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { bio, skills, githubUsername, location, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        bio,
        skills,
        githubUsername,
        location,
        role,
      },
      { new: true },
    ).select("-password");

    res.json({
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error updating profile",
    });
  }
});

app.post("/api/users/:id/avatar", upload.single("avatar"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "devconnect_avatars",
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: result.secure_url },
      { new: true },
    ).select("-password");

    fs.unlinkSync(req.file.path);

    res.json({
      message: "Avatar uploaded",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error uploading avatar",
    });
  }
});

/* POSTS */

app.post("/api/posts", upload.single("image"), async (req, res) => {
  try {
    const { content, tech, userId } = req.body;

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "devconnect_posts",
      });

      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const techArray =
      typeof tech === "string"
        ? tech
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const post = await Post.create({
      content,
      tech: techArray,
      image: imageUrl,
      user: userId,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("user", "name email avatar role")
      .populate("comments.user", "name email avatar role");

    res.json({
      message: "Post created",
      post: populatedPost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating post",
    });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email avatar role")
      .populate("comments.user", "name email avatar role")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching posts",
    });
  }
});

app.put("/api/posts/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    if (!alreadyLiked && post.user.toString() !== userId) {
      await Notification.create({
        receiver: post.user,
        sender: userId,
        type: "like",
        text: "liked your post",
        link: "/dashboard",
      });
    }

    const updatedPost = await Post.findById(req.params.id)
      .populate("user", "name email avatar role")
      .populate("comments.user", "name email avatar role");

    res.json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      post: updatedPost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error liking post",
    });
  }
});

app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({
        message: "You can delete only your own post",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      message: "Post deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error deleting post",
    });
  }
});

app.post("/api/posts/:id/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    post.comments.push({
      text,
      user: userId,
    });

    await post.save();

    if (post.user.toString() !== userId) {
      await Notification.create({
        receiver: post.user,
        sender: userId,
        type: "comment",
        text: "commented on your post",
        link: "/dashboard",
      });
    }

    const updatedPost = await Post.findById(req.params.id)
      .populate("user", "name email avatar role")
      .populate("comments.user", "name email avatar role");

    res.json({
      message: "Comment added",
      post: updatedPost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error adding comment",
    });
  }
});

/* PROJECTS */

app.post("/api/projects", async (req, res) => {
  try {
    const { title, description, tech, githubLink, demoLink, userId } = req.body;

    const project = await Project.create({
      title,
      description,
      tech,
      githubLink,
      demoLink,
      user: userId,
    });

    const populatedProject = await Project.findById(project._id).populate(
      "user",
      "name email avatar role",
    );

    res.json({
      message: "Project created",
      project: populatedProject,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating project",
    });
  }
});

app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("user", "name email avatar role")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching projects",
    });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.user.toString() !== userId) {
      return res.status(403).json({
        message: "You can delete only your own project",
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      message: "Project deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error deleting project",
    });
  }
});

/* SNIPPETS */

app.post("/api/snippets", async (req, res) => {
  try {
    const { title, code, language, userId } = req.body;

    const snippet = await Snippet.create({
      title,
      code,
      language,
      user: userId,
    });

    const populatedSnippet = await Snippet.findById(snippet._id).populate(
      "user",
      "name email avatar role",
    );

    res.json({
      message: "Snippet created",
      snippet: populatedSnippet,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating snippet",
    });
  }
});

app.get("/api/snippets", async (req, res) => {
  try {
    const snippets = await Snippet.find()
      .populate("user", "name email avatar role")
      .sort({ createdAt: -1 });

    res.json(snippets);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching snippets",
    });
  }
});

app.delete("/api/snippets/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({
        message: "Snippet not found",
      });
    }

    if (snippet.user.toString() !== userId) {
      return res.status(403).json({
        message: "You can delete only your own snippet",
      });
    }

    await Snippet.findByIdAndDelete(req.params.id);

    res.json({
      message: "Snippet deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error deleting snippet",
    });
  }
});

/* GITHUB */

app.get("/api/github/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const profileResponse = await axios.get(
      `https://api.github.com/users/${username}`,
    );

    const reposResponse = await axios.get(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`,
    );

    res.json({
      profile: profileResponse.data,
      repos: reposResponse.data,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Error fetching GitHub data",
    });
  }
});

/* CONNECTIONS */

app.post("/api/connections/request", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!receiver.connectionRequests.some((id) => id.toString() === senderId)) {
      receiver.connectionRequests.push(senderId);
      await receiver.save();

      await Notification.create({
        receiver: receiverId,
        sender: senderId,
        type: "connection",
        text: "sent you a connection request",
        link: "/connections",
      });
    }

    res.json({
      message: "Request sent",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error sending request",
    });
  }
});

app.get("/api/connections/requests/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "connectionRequests",
      "name email avatar role",
    );

    res.json(user.connectionRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching requests",
    });
  }
});

app.post("/api/connections/accept", async (req, res) => {
  try {
    const { userId, senderId } = req.body;

    const user = await User.findById(userId);
    const sender = await User.findById(senderId);

    if (!user.connections.some((id) => id.toString() === senderId)) {
      user.connections.push(senderId);
    }

    if (!sender.connections.some((id) => id.toString() === userId)) {
      sender.connections.push(userId);
    }

    user.connectionRequests = user.connectionRequests.filter(
      (id) => id.toString() !== senderId,
    );

    await user.save();
    await sender.save();

    res.json({
      message: "Connection accepted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error accepting request",
    });
  }
});

app.get("/api/connections/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "connections",
      "name email avatar role",
    );

    const uniqueConnections = user.connections.filter(
      (person, index, self) =>
        index ===
        self.findIndex((p) => p._id.toString() === person._id.toString()),
    );

    res.json(uniqueConnections);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching connections",
    });
  }
});

app.get("/api/connections/mutual/:userId/:profileId", async (req, res) => {
  try {
    const { userId, profileId } = req.params;

    const currentUser = await User.findById(userId);

    const profileUser = await User.findById(profileId).populate(
      "connections",
      "name email avatar role",
    );

    const mutuals = profileUser.connections.filter((connection) =>
      currentUser.connections.some(
        (id) => id.toString() === connection._id.toString(),
      ),
    );

    const uniqueMutuals = mutuals.filter(
      (person, index, self) =>
        index ===
        self.findIndex((p) => p._id.toString() === person._id.toString()),
    );

    res.json({
      connectionCount: profileUser.connections.length,
      mutuals: uniqueMutuals,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching mutual connections",
    });
  }
});

/* MESSAGES */

/* UNREAD MESSAGE COUNT - ALWAYS FIRST */
app.get("/api/messages/unread-count/:userId", async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.params.userId,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    console.log("Unread count error:", error);
    res.status(500).json({
      message: "Error fetching unread message count",
    });
  }
});

/* MARK CONVERSATION AS READ - SECOND */
app.put("/api/messages/read/:userId/:senderId", async (req, res) => {
  try {
    await Message.updateMany(
      {
        receiver: req.params.userId,
        sender: req.params.senderId,
      },
      {
        isRead: true,
      },
    );

    res.json({
      message: "Messages marked as read",
    });
  } catch (error) {
    console.log("Mark read error:", error);
    res.status(500).json({
      message: "Error marking messages as read",
    });
  }
});

/* GET MESSAGES BETWEEN TWO USERS - ALWAYS LAST */
app.get("/api/messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .populate("sender", "name email avatar role")
      .populate("receiver", "name email avatar role")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.log("Fetch messages error:", error);
    res.status(500).json({
      message: "Error fetching messages",
    });
  }
});

/* DIRECT MESSAGE */
app.post("/api/direct-message", async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    if (!senderId || !receiverId || !text) {
      return res.status(400).json({
        message: "Missing message details",
      });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text,
      isRead: false,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email avatar role")
      .populate("receiver", "name email avatar role");

    res.json({
      message: "Message sent",
      data: populatedMessage,
    });
  } catch (error) {
    console.log("Direct message error:", error);
    res.status(500).json({
      message: "Error sending message",
    });
  }
});

/* CODE ROOMS */

app.post("/api/code-rooms", async (req, res) => {
  try {
    const { title, description, language, difficulty, userId } = req.body;

    const roomId = title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    const room = await CodeRoom.create({
      roomId,
      title,
      description,
      language,
      difficulty,
      createdBy: userId,
    });

    res.json({
      message: "Code room created",
      room,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating code room",
    });
  }
});

app.get("/api/code-rooms/:roomId", async (req, res) => {
  try {
    const room = await CodeRoom.findOne({
      roomId: req.params.roomId,
    }).populate("createdBy", "name email avatar role");

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    res.json(room);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching room",
    });
  }
});

/* JOBS */

app.post("/api/jobs", async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      jobType,
      skills,
      description,
      recruiterId,
    } = req.body;

    const job = await Job.create({
      title,
      company,
      location,
      jobType,
      skills,
      description,
      recruiter: recruiterId,
    });

    const populatedJob = await Job.findById(job._id)
      .populate("recruiter", "name email avatar role")
      .populate("applicants", "name email avatar role skills");

    res.json({
      message: "Job created",
      job: populatedJob,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating job",
    });
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("recruiter", "name email avatar role")
      .populate("applicants", "name email avatar role skills")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching jobs",
    });
  }
});

app.put("/api/jobs/:id/apply", async (req, res) => {
  try {
    const { userId } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const alreadyApplied = job.applicants.some(
      (id) => id.toString() === userId,
    );

    if (!alreadyApplied) {
      job.applicants.push(userId);
      await job.save();

      await Notification.create({
        receiver: job.recruiter,
        sender: userId,
        type: "job",
        text: "applied to your job post",
        link: "/recruiter",
      });
    }

    const updatedJob = await Job.findById(req.params.id)
      .populate("recruiter", "name email avatar role")
      .populate("applicants", "name email avatar role skills");

    res.json({
      message: alreadyApplied ? "Already applied" : "Applied successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error applying to job",
    });
  }
});

app.delete("/api/jobs/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.recruiter.toString() !== userId) {
      return res.status(403).json({
        message: "You can delete only your own job",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      message: "Job deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error deleting job",
    });
  }
});

/* NOTIFICATIONS */

app.get("/api/notifications/unread-count/:userId", async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      receiver: req.params.userId,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching unread notification count",
    });
  }
});

app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req.params.userId,
    })
      .populate("sender", "name avatar role")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching notifications",
    });
  }
});

app.put("/api/notifications/read/:userId", async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.params.userId },
      { isRead: true },
    );

    res.json({
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error updating notifications",
    });
  }
});

/* FREE AI PORTFOLIO REVIEW */

app.post("/api/ai/portfolio-review/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const projects = await Project.find({
      user: req.params.userId,
    });

    const snippets = await Snippet.find({
      user: req.params.userId,
    });

    let score = 5;

    if (user.bio && user.bio.length > 40) score += 1;
    if (user.skills && user.skills.length >= 3) score += 1;
    if (user.githubUsername) score += 1;
    if (projects.length >= 2) score += 1;
    if (snippets.length >= 2) score += 1;

    if (score > 10) score = 10;

    const strengths = [];

    if (user.skills?.length > 0) {
      strengths.push(
        `You have listed relevant skills like ${user.skills
          .slice(0, 4)
          .join(", ")}.`,
      );
    }

    if (projects.length > 0) {
      strengths.push(
        `You have ${projects.length} project(s), which helps recruiters understand your practical work.`,
      );
    }

    if (snippets.length > 0) {
      strengths.push(
        `You have added ${snippets.length} code snippet(s), showing your coding practice.`,
      );
    }

    if (user.githubUsername) {
      strengths.push(
        "Your GitHub profile is connected, which improves your technical credibility.",
      );
    }

    if (strengths.length === 0) {
      strengths.push(
        "Your profile has a good starting structure, but it needs more details.",
      );
    }

    const weakAreas = [];

    if (!user.bio || user.bio.length < 40) {
      weakAreas.push(
        "Your bio is short. Add a clearer introduction about your role, goals, and tech interests.",
      );
    }

    if (!user.skills || user.skills.length < 3) {
      weakAreas.push("Add at least 3–5 strong technical skills.");
    }

    if (!user.githubUsername) {
      weakAreas.push(
        "Connect your GitHub username to show repositories and coding activity.",
      );
    }

    if (projects.length < 2) {
      weakAreas.push(
        "Add more projects with description, tech stack, GitHub link, and live demo.",
      );
    }

    if (snippets.length < 2) {
      weakAreas.push("Add more code snippets to showcase your coding style.");
    }

    if (weakAreas.length === 0) {
      weakAreas.push(
        "Your profile is strong. Focus on polishing project descriptions and adding live demos.",
      );
    }

    const projectTips =
      projects.length > 0
        ? projects
            .slice(0, 3)
            .map(
              (project, index) =>
                `${index + 1}. ${project.title}: Add clear problem statement, features, tech stack, GitHub link, and live demo if missing.`,
            )
            .join("\n")
        : "Add at least 2 portfolio-level projects such as MERN social app, dashboard, AI tool, or real-time chat app.";

    const review = `
Overall Rating: ${score}/10

Strengths:
${strengths.map((item) => `- ${item}`).join("\n")}

Weak Areas:
${weakAreas.map((item) => `- ${item}`).join("\n")}

Profile Improvement Tips:
- Write a strong 3–4 line bio explaining who you are, what you build, and what technologies you use.
- Keep your role clear, for example: MERN Stack Developer, Frontend Developer, or Full Stack Developer.
- Add your strongest skills first.
- Keep your GitHub updated with clean README files.

Project Improvement Tips:
${projectTips}

Recruiter Impression:
A recruiter will understand your profile better if your bio, skills, GitHub, and projects clearly show what you can build. Keep your projects polished, add live links, and explain your contribution clearly.

Final Suggestion:
Focus on 2–3 strong projects with clean UI, proper README, screenshots, live demo, and GitHub links. This will make your portfolio much stronger.
`;

    res.json({ review });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Free portfolio review failed",
    });
  }
});

/* SAVED POSTS */

app.put("/api/posts/:postId/save", async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const alreadySaved = user.savedPosts.some((id) => id.toString() === postId);

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId,
      );
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();

    res.json({
      message: alreadySaved ? "Post unsaved" : "Post saved",
      savedPosts: user.savedPosts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error saving post",
    });
  }
});

app.get("/api/users/:userId/saved-posts", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate({
      path: "savedPosts",
      populate: [
        {
          path: "user",
          select: "name email avatar role",
        },
        {
          path: "comments.user",
          select: "name email avatar role",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user.savedPosts.reverse());
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching saved posts",
    });
  }
});

/* TRENDING */

app.get("/api/trending", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email avatar role skills")
      .populate("comments.user", "name email avatar role")
      .sort({ createdAt: -1 });

    const trendingPosts = posts
      .map((post) => {
        const likesCount = post.likes?.length || 0;
        const commentsCount = post.comments?.length || 0;

        const hoursOld =
          (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);

        const recencyBoost = Math.max(0, 24 - hoursOld);

        const score = likesCount * 3 + commentsCount * 2 + recencyBoost;

        return {
          ...post.toObject(),
          trendingScore: Math.round(score),
        };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 5);

    const users = await User.find().select("-password");

    const topDevelopers = users
      .map((user) => {
        const userPosts = posts.filter(
          (post) => post.user?._id.toString() === user._id.toString(),
        );

        const totalLikes = userPosts.reduce(
          (sum, post) => sum + (post.likes?.length || 0),
          0,
        );

        const totalComments = userPosts.reduce(
          (sum, post) => sum + (post.comments?.length || 0),
          0,
        );

        return {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          skills: user.skills,
          score: totalLikes * 3 + totalComments * 2 + userPosts.length,
        };
      })
      .filter((user) => user.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const tagMap = {};

    posts.forEach((post) => {
      post.tech?.forEach((tag) => {
        const cleanTag = tag.trim();

        if (cleanTag) {
          tagMap[cleanTag] = (tagMap[cleanTag] || 0) + 1;
        }
      });
    });

    const trendingTags = Object.entries(tagMap)
      .map(([tag, count]) => ({
        tag,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({
      trendingPosts,
      topDevelopers,
      trendingTags,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching trending data",
    });
  }
});

/* RECRUITER ANALYTICS */

app.get("/api/recruiter/analytics/:recruiterId", async (req, res) => {
  try {
    const { recruiterId } = req.params;

    const jobs = await Job.find({
      recruiter: recruiterId,
    }).populate("applicants", "name email avatar role skills");

    const totalJobs = jobs.length;

    const totalApplicants = jobs.reduce(
      (sum, job) => sum + job.applicants.length,
      0,
    );

    const activeJobs = jobs.filter((job) => job.applicants.length < 10).length;

    const skillMap = {};

    jobs.forEach((job) => {
      job.applicants.forEach((applicant) => {
        applicant.skills?.forEach((skill) => {
          const cleanSkill = skill.trim();

          if (cleanSkill) {
            skillMap[cleanSkill] = (skillMap[cleanSkill] || 0) + 1;
          }
        });
      });
    });

    const topSkills = Object.entries(skillMap)
      .map(([skill, count]) => ({
        skill,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    res.json({
      totalJobs,
      totalApplicants,
      activeJobs,
      topSkills,
    });
  } catch (error) {
    console.log("Recruiter analytics error:", error);
    res.status(500).json({
      message: "Error fetching recruiter analytics",
    });
  }
});

/* SMART SEARCH */

app.get("/api/search/:query", async (req, res) => {
  try {
    const query = req.params.query;

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { role: { $regex: query, $options: "i" } },
        { skills: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    const posts = await Post.find({
      content: { $regex: query, $options: "i" },
    })
      .populate("user", "name avatar role")
      .limit(10);

    const projects = await Project.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { tech: { $regex: query, $options: "i" } },
      ],
    }).limit(10);

    res.json({ users, posts, projects });
  } catch (error) {
    console.log("Search error:", error);
    res.status(500).json({ message: "Search error" });
  }
});

/* PUBLIC DEV PROFILE */

app.get("/api/dev/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Developer not found",
      });
    }

    const projects = await Project.find({
      user: user._id,
    });

    const snippets = await Snippet.find({
      user: user._id,
    });

    res.json({
      user,
      projects,
      snippets,
    });
  } catch (error) {
    console.log("Public dev profile error:", error);
    res.status(500).json({
      message: "Error fetching developer profile",
    });
  }
});

/* SOCKET.IO */

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user-online", async (userId) => {
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      lastSeen: new Date(),
    });

    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("send-message", async (data) => {
    try {
      const message = await Message.create({
        sender: data.sender,
        receiver: data.receiver,
        text: data.text,
      });

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name email avatar role")
        .populate("receiver", "name email avatar role");

      io.emit("receive-message", populatedMessage);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("typing", ({ senderId, receiverId, senderName }) => {
    io.emit("user-typing", {
      senderId,
      receiverId,
      senderName,
    });
  });

  socket.on("stop-typing", ({ senderId, receiverId }) => {
    io.emit("user-stop-typing", {
      senderId,
      receiverId,
    });
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("receive-code", code);
  });

  socket.on("language-change", ({ roomId, language }) => {
    socket.to(roomId).emit("receive-language", language);
  });

  socket.on("disconnect", () => {
    let disconnectedUserId = null;

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);

      User.findByIdAndUpdate(disconnectedUserId, {
        lastSeen: new Date(),
      }).catch((error) => console.log(error));
    }

    io.emit("online-users", Array.from(onlineUsers.keys()));

    console.log("User disconnected:", socket.id);
  });
});

/* SERVER */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server Started on ${PORT}`);
});
