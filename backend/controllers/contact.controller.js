import { Contact } from "../models/Contact.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//Function to get the contacts. Since this is a GET request so we will use req.query and not req.body .
export const getContacts = asyncHandler(async (req, res) => {

    //Fetch search and tag from req.query .
    const {search, tag} = req.query;
    //Add the filter to attatch owner from our req.user object.
    const filter = { owner: req.user._id};
    //add tags to our filter if it exists
    if(tag) filter.tags =  tag;

    //Add the search to our filter if it exists.
    if(search) {
        const rx = new RegExp(search, "i");
        filter.$or = [
            {name: rx},
            {email: rx},
            {company: rx}            
        ];
    }

    //Find the contacts based on the filter and sort them by favourite and then name.
    const contacts = await Contact.find(filter).sort({favourite: -1, name: 1});

    //Send the response.
    res.json({success: true, count: contacts.length, contacts});
});

//Function to get a particular contact
export const getContact = asyncHandler(async (req, res) => {
    //Find the contact using the contact id and user's id.
    const contact = await Contact.findOne({ _id: req.params.id, owner:req.body._id });
    //if the contact is not present then throw contact not found error.
    if(!contact) throw new ApiError(404,"Contact not found");

    //Return success and contact details.
    res.json({success:true, contact});
});

//Function to create a contact
export const createContact = asyncHandler(async (req, res) => {
    //Override the owner field so that the user cannot create a contact in the name of other users.
    const contact = await Contact.create({owner: req.user._id,...req.body,});
    //Return the success and contact details.
    res.status(201).json({success:true, contact});
});

//Function to update the contact
export const updateContact = asyncHandler(async (req, res) => {
    //Remove the owner and add everything else to updates.
    const {owner, ...updates} = req.body;

    //find the contact using contact id and user id.
    const contact = await Contact.findByIdAndUpdate(
        {id: req.params.id, owner: req.body._id},
        updates,
        {new:true, runValidators:true}
    );
    
    //if the contact is not present then throw contact not found error.
    if(!contact) throw new ApiError(404, "Contact not found");
    
    //Return success and contact details.
    res.json({success:true, contact});
});

//Function to delete a contact
export const deleteContact = asyncHandler(async (req, res)=>{
    const contact = await Contact.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id 
    });
    //if the contact is not present then throw contact not found error.
    if(!contact) throw new ApiError(404, "Contact not found");
    //Return success and message.
    res.json({success:true, message:"Contact deleted successfully"});
});