import { Lead } from "../models/Lead.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const getLeads = asyncHandler(async (req, res ) => {
    //Get status, priority, source and search from request body. (Optional)
    const {status, priority, source, search} = req.body;

    //Only return the leads that belong to this user. Without this filter, every user could see every other user's leads.
    const filter = { owner: req.user._id };

    //Add filters based on request body
    if(status) filter.status = status;
    if(priority) filter.priority = priority;
    if(source) filter.source = source;
    if(search) {
        //Create a regular expression to search for the term in name, email and company. The "i" flag makes the search case-insensitive.
        const rx = new RegExp(search, "i");
        filter.$or = [{name: rx},{ email: rx},{company:rx}];
    }

    //Fetch the leads using the filter and sort in ascending order for "order" and descending order for "createdAt".
    const leads = await Lead.find(filter).sort({ order: 1, createdAt: -1});

    //Return success, cound and leads.
    res.json({success: true, count:leads.length, leads});
}); 

//Function to get a particular Lead by ID
export const getLead = asyncHandler(async (req, res) => {
    //get the lead id from the request parameters and user id from logged in user.
    const lead = await Lead.findOne({ _id: req.params.id, owner: req.user._id });
    //if the lead is not found, throw an error.
    if(!lead){
        throw new ApiError(404, "Lead not found");
    }

    //return success and that particular lead if present.
    res.json({success: true, lead});
});

//Function to create a lead
export const createLead = asyncHandler(async (req, res) => {

    //Create the lead using all the properties of req.body and add a new proper owner to it.
    //Here "..." is the spread operator. It basically copies all the key-value pairs of req.body to the new lead object.
    const lead = await Lead.create({ ...req.body, owner: req.user._id});

    //Send success and the newly created lead
    res.status(201).json({success: true, lead});

});

//Function to update a lead
export const updateLead = asyncHandler(async (req, res) => {

    //Object Destructuring - Destructure req.body to get owner and updates. Here "..." is the rest operator.
    //We remove owner because user should not be allowed to update the owner in a lead through request.
    const {owner, ...updates} = req.body;

    //We automatically assign the owner using our req.user object's _id.
    const lead = await Lead.findOneAndUpdate(
        {_id: req.params.id, owner: req.user._id }, //filter
        updates, //update
        { new: true, runValidators: true} //options
    );

    //If the lead is not present then throw lead not found error.
    if(!lead) throw new ApiError(404, "Lead not found");

    //send success and that particular lead if present.
    res.json({success: true, lead});

});

//Function to delete a lead
export const deleteLead = asyncHandler(async (req,res) => {
    //In this function too, we will automatically assign the owner from req.body's _id.
    const lead = await Lead.findByIdAndDelete({ _id: req.params.id, owner: req.user._id});

    //If the lead is not present then throw lead not found error.
    if(!lead) throw new ApiError(404, "Lead not found");
    
    //Return success and the message
    res.json({success: true, message:"Lead deleted"});
});

//Function to reorder the leads. Used in the Kanban board.
export const reorderLeads = asyncHandler(async (req, res) => {
    //Get the updates array from the request body
    const { updates } = req.body;

    //If the updates array is not an array, throw an error.
    if(!Array.isArray(updates)) {
        throw new ApiError(400, "Updates must be an array");
    }

    //This line is the key to updating multiple leads at once. 
    //It uses Promise.all to wait for all the updates to complete.
    //For each update in the updates array, it updates the lead with the given id and owner.
    await Promise.all(
        updates.map((u) =>
        Lead.updateOne(
            {_id: u.id, owner: req.user._id},
            { $set: { status: u.status, order: u.order }}
        )
      )
    );

    //Return success and the message
    res.json({success:true, message:"Pipeline updated"});
});