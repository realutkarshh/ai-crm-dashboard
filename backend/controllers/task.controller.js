import {Task} from "../models/Task.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const getTasks = asyncHandler(async (req, res) => {
    // Extract filter values from the query parameters
    // Example:
    // GET /api/tasks?status=Pending&priority=High
    const { status, priority, relatedLead } = req.query;

    // Initially, only fetch tasks that belong to the logged-in user
    const filter = {
        owner: req.user._id
    };

    // Add optional filters if they are provided
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (relatedLead) filter.relatedLead = relatedLead;

    // Fetch matching tasks from MongoDB
    const tasks = await Task.find(filter)

        // Sort tasks by:
        // 1. Status (ascending)
        // 2. Due date (earliest first)
        // 3. Creation date (newest first)
        .sort({
            status: 1,
            dueDate: 1,
            createdAt: -1
        })

        // Replace relatedLead ObjectId with Lead document
        // Only include name and company fields
        .populate("relatedLead", "name company")

        // Replace relatedContact ObjectId with Contact document
        // Only include name and company fields
        .populate("relatedContact", "name company");

    // Return all matching tasks
    res.json({
        success: true,
        count: tasks.length,
        tasks
    });
});

export const createTask = asyncHandler(async (req, res) => {

    // Create a new task.
    // Copy everything from req.body and assign
    // the logged-in user as the owner.
    const task = await Task.create({
        ...req.body,
        owner: req.user._id
    });

    // Return the newly created task
    res.status(201).json({
        success: true,
        task
    });
});

export const updateTask = asyncHandler(async (req, res) => {

    // Remove "owner" so users cannot change task ownership.
    // All remaining fields are collected into "updates".
    const { owner, ...updates } = req.body;

    // If the task is marked as Completed
    // and completedAt is not already provided,
    // automatically set the completion time.
    if (updates.status === "Completed" && !updates.completedAt) {
        updates.completedAt = new Date();
    }

    // If the task status changes from Completed
    // to something else, remove the completion date.
    if (updates.status && updates.status !== "Completed") {
        updates.completedAt = null;
    }

    // Find the task that:
    // 1. Matches the given ID
    // 2. Belongs to the logged-in user
    // Then update it.
    const task = await Task.findOneAndUpdate(
        {
            _id: req.params.id,
            owner: req.user._id
        },
        updates,
        {
            // Return the updated document
            new: true,

            // Validate updated fields using schema rules
            runValidators: true
        }
    );

    // If the task doesn't exist (or doesn't belong to the user)
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Return the updated task
    res.json({
        success: true,
        task
    });
});


export const deleteTask = asyncHandler(async (req, res) => {

    // Find the task by ID and make sure
    // it belongs to the logged-in user.
    // If found, delete it.
    const task = await Task.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id
    });

    // If no matching task exists
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Send success response
    res.json({
        success: true,
        message: "Task deleted"
    });
});