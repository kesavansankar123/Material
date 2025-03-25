// Backend - server.js
const express = require("express");
const Mongoose = require("mongoose");
// const cors = require("cors");
const bodyParser = require("body-parser");
const PORT = 3000;
const app = express();
app.use(express.json());
const cors = require("cors");

app.use(cors({
  origin: "*", // Allow requests from any origin (Use specific domain in production)
  methods: ["GET", "POST", "PUT", "DELETE"], // Allow these methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
}));
// const url="mongodb://127.0.0.1:27017/login_apis"
const url = 'mongodb+srv://gokul:sankar@mern.sqrvp1s.mongodb.net/?retryWrites=true&w=majority&appName=mern'

app.use(bodyParser.json());
app.use(express.json());

function loginDetails() {
  Mongoose.connect(url) 
  // Mongoose.connection.once('open',() => {
  //     console.log('connected success');
      const db = Mongoose.connection;
      db.on('error', console.error.bind(console, 'MongoDB connection error:'));
      db.once('open', () => {
      console.log('Connected to MongoDB');
});       
}

loginDetails();

const mongoose = require("mongoose");

const MaterialCategorySchema = new mongoose.Schema({
  materialCategory: { type: String, required: true },
  categoryDescription: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdOn: { type: Date, default: Date.now }, // Automatically sets the creation date
  createdBy: { type: String, default: "Gokulsankar" } // Reference to a user
});

const Todo = mongoose.model("MaterialCategory", MaterialCategorySchema);

const DeletedMaterial = new mongoose.Schema({
  materialId: String, // Store the original ID
  materialCategory: String,
  categoryDescription: String,
  completed: Boolean,
  createdBy: { type: String, default: "Gokulsankar" }, // Reference to a user
  createdOn: { type: Date, default: Date.now },
  deletedOn: { type: Date, default: () => new Date() } // Ensure it's a Date object
});

const deletedHistory = mongoose.model("DeletedHistory", DeletedMaterial);


// const Todo = Mongoose.model("material", Material_Category);


app.get('/', (req,
 res) => {
  res.send('Hello, World!');
});




// Routes
app.get("/material", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdOn: -1 });

    // Format the createdOn date for each todo
    const formattedTodos = todos.map(todo => ({
      ...todo._doc, // Spread existing data
      createdOn: new Date(todo.createdOn).toLocaleDateString("en-GB").replace(/\//g, "-") // Convert format
    }));

    res.json({
      data: formattedTodos,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



app.get("/material/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Format the createdOn date
    const formattedTodo = {
      ...todo._doc, // Spread existing data
      createdOn: new Date(todo.createdOn).toLocaleDateString("en-GB").replace(/\//g, "-")
    };

    res.json({ data: formattedTodo });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});






app.post("/material", async (req, res) => {
  const newTodo = new Todo({ materialCategory: req.body.materialCategory, categoryDescription:req.body.categoryDescription, completed: false });
  await newTodo.save();
  res.json(newTodo);
});




app.put("/material/:id", async (req, res) => {
  const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedTodo);
});

// app.delete("/material/:id", async (req, res) => {
//   await Todo.findByIdAndDelete(req.params.id);
//   res.json({ message: "Material Deleted" });
// });

app.delete("/material/:id", async (req, res) => {
  try {
    // Find the item to delete
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Material not found" });
    }

    // First, copy the data to DeletedTodo before deleting
    const deleteMaterial = new deletedHistory({
      materialId: todo._id,
      materialCategory: todo.materialCategory,
      categoryDescription: todo.categoryDescription,
      completed: todo.completed,
      createdOn: todo.createdOn,
      createdBy: todo.createdBy
    });

    await deleteMaterial.save(); // Save the deleted record

    // After successfully saving to DeletedTodo, delete from Todo
    await Todo.findByIdAndDelete(req.params.id);

    res.json({ message: "Material deleted and saved in history" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



app.get("/history", async (req, res) => {
  try {
    const todos = await deletedHistory.find().sort({ deletedOn: -1 });

    const formattedTodos = todos.map(todo => ({
      ...todo._doc, // Spread existing data
      createdOn: new Date(todo.createdOn).toLocaleDateString("en-GB").replace(/\//g, "-"), // Convert format
      deletedOn: new Date(todo.deletedOn).toLocaleDateString("en-GB").replace(/\//g, "-")
    }));

    res.json({
      data: formattedTodos
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/history/:id", async (req, res) => {
  try {
    const todo = await deletedHistory.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Format the createdOn and deletedOn dates
    const formattedTodo = {
      ...todo._doc, // Spread existing data
      createdOn: todo.createdOn ? new Date(todo.createdOn).toLocaleDateString("en-GB").replace(/\//g, "-") : null,
      deletedOn: todo.deletedOn ? new Date(todo.deletedOn).toLocaleDateString("en-GB").replace(/\//g, "-") : null
    };

    res.json({ data: formattedTodo });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



app.delete("/history/:id", async (req, res) => {
  try {
    // Find the item to delete
    const todo =     await deletedHistory.findByIdAndDelete(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Material not found" });
    }
    res.json({ message: "Material History Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});





app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});