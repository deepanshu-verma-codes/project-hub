require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(mongoUri);
    console.log("Connected.");

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    // 1. Create an Admin User
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@yopmail.com",
      password: "password123", // Will be hashed by the User model pre-save hook
      role: "Admin",
    });
    console.log("Created Admin User: admin@yopmail.com / password123");

    // 2. Create a Manager
    const managerUser = await User.create({
      name: "Project Manager",
      email: "manager@yopmail.com",
      password: "password123",
      role: "Manager",
    });
    console.log("Created Manager User");

    // 3. Create a Developer
    const devUser = await User.create({
      name: "Developer One",
      email: "dev@yopmail.com",
      password: "password123",
      role: "Developer",
    });
    console.log("Created Developer User");

    // 4. Create a Project
    const project = await Project.create({
      name: "Multi-Vendor Marketplace Engine",
      description:
        "Core roadmap to scale vendor onboarding, advanced search infrastructure, and split-payment checkout flows.",
      ownerId: adminUser._id,
      members: [managerUser._id, devUser._id],
    });
    console.log(`Created Project: ${project.name}`);

    // 5. Create Sample Tasks (Marketplace Features & Adjustments)
    const tasks = [
      {
        title: "BE: Implement Vendor Onboarding & Stripe Custom Connect",
        description:
          "Create endpoints to initialize Stripe Connect onboarding for marketplace sellers. Handle webhook events (account.updated) to verify onboarding status and update the vendor's restriction flags in the database.",
        status: "Done",
        projectId: project._id,
        assigneeId: devUser._id,
        position: 0,
      },
      {
        title:
          "BE: Database Layer Updates for Multi-Vendor Inventory & Pricing",
        description:
          "Update the Product schema to support vendor separation, dynamic SKU variants, tax categories, and inventory stock tracking. Add compound indexing on [vendorId + status] to optimize seller dashboard loading times.",
        status: "In Progress",
        projectId: project._id,
        assigneeId: devUser._id,
        position: 0,
      },
      {
        title:
          "BE: Integrate Elasticsearch/Algolia Pipeline for Product Discovery",
        description:
          "Set up a database listener or Mongoose middleware to sync listing updates directly to the search index. Implement search filters for price ranges, product attributes, custom categories, and vendor ratings.",
        status: "Todo",
        projectId: project._id,
        assigneeId: managerUser._id,
        position: 0,
      },
      {
        title: "FE: Build Vendor Dashboard Layout & Performance Metrics UI",
        description:
          "Create a dedicated portal for marketplace vendors using React and Zustand. Build UI views for listing new products, viewing current inventory counts, tracking payout histories, and displaying simple revenue graphs.",
        status: "Todo",
        projectId: project._id,
        assigneeId: devUser._id,
        position: 0,
      },
      {
        title:
          "FE: Implement Marketplace Product Grid with Advanced Faceted Search",
        description:
          "Develop the main buyer-facing marketplace feed. Integrate sidebar filters for dynamic attributes (size, category, vendor localization) and sync search parameters directly with the browser URL for easy link-sharing.",
        status: "Todo",
        projectId: project._id,
        assigneeId: devUser._id,
        position: 1,
      },
      {
        title: "BE: Build Split-Payment Engine & Escrow Release Triggers",
        description:
          "Develop backend payment processing logic to split customer checkout totals between multiple vendors in a single cart. Implement logic to hold platform fees and keep vendor funds in escrow until shipping confirmation is received.",
        status: "Todo",
        projectId: project._id,
        assigneeId: managerUser._id,
        position: 1,
      },
    ];

    await Task.insertMany(tasks);
    console.log(`Successfully seeded ${tasks.length} tasks.`);

    console.log("Seeding complete. Press Ctrl+C to exit.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
