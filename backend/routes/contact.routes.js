import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
    getContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact
} from "../controllers/contact.controller.js";

const router = Router();

//Apply middleware to all the routes
router.use(protect);

//Route for get and post request
router.route("/").get(getContacts).post(createContact);

//Route for get, put and delete request
router.route("/:id").get(getContact).put(updateContact).delete(deleteContact);

export default router;