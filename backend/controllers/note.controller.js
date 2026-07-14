import { Note } from "../models/Note.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

//Function to get Notes
export const getNotes = asyncHandler(async (req, res) => {
    //Fetch lead, contact and search from the URL. GET request so we use req.query
    const {lead, contact, search} = req.query;

    //We will add a filter of owner so that we only get notes of logged in user.
    const filter = {owner: req.user._id};

    //Add filters based on request body
    if(lead) filter.lead = lead;
    if(contact) filter.contact = contact;
    if(search) filter.content = new RegExp(search, "i"); //This "i" makes the search case-insensitive.

    //Fetch notes based on the filter. Sort by pinned first (descending), then by creation time (ascending).
    const notes = await Note.find(filter)
    .sort({ pinned: -1, createdAt: -1})
    .populate("lead","name company") //Populate lead with name and company.
    .populate("contact","name company"); //Populate contact with name and company.

    //Return success, count and notes.
    res.json({success:true, count:notes.length, notes});
});

//Function to create a note.
export const createNote = asyncHandler(async (req, res) => {

    // Extract the required fields from the request body
    const { content, lead, contact, pinned } = req.body;

    // A note must have some content
    if (!content) {
        throw new ApiError(400, "Note content is required");
    }

    // Create a new note in MongoDB
    const note = await Note.create({
        // Assign the note to the currently logged-in user
        owner: req.user._id,
        // Note content
        content,
        // If a lead is provided, store its ID.
        // Otherwise store null.
        lead: lead || null,
        // If a contact is provided, store its ID.
        // Otherwise store null.
        contact: contact || null,
        // Convert pinned into a true/false boolean value
        pinned: Boolean(pinned),
    });

    // Send the created note back to the client
    res.status(201).json({
        success: true,
        note
    });
});

//Function to update a note.
export const updateNote = asyncHandler(async (req, res) => {
    // Remove "owner" from the request body so that
    // users cannot change the owner of the note.
    // All remaining fields are collected into "updates".
    const { owner, ...updates } = req.body;

    // Find the note that:
    // 1. Matches the given ID
    // 2. Belongs to the logged-in user
    // Then update it using the "updates" object.
    const note = await Note.findOneAndUpdate(
        {
            _id: req.params.id,
            owner: req.user._id
        },
        updates,
        {
            // Return the updated document instead of the old one
            new: true,

            // Validate updated fields using the schema
            runValidators: true
        }
    );

    // If no matching note exists, return 404
    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    // Return the updated note
    res.json({
        success: true,
        note
    });
});

//Function to delete a note.
export const deleteNote = asyncHandler(async (req, res) => {
    // Find the note by ID and make sure it belongs
    // to the currently logged-in user.
    // If found, delete it.
    const note = await Note.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id
    });

    // If no note is found, return a 404 error
    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    // Send a success response after deletion
    res.json({
        success: true,
        message: "Note deleted"
    });
});