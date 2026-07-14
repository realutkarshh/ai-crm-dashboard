import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getLeads, getLead, createLead, updateLead, deleteLead, reorderLeads } from "../controllers/lead.controller.js";

const router = Router();

//The protect middleware is applied to all the routes present in this file.
router.use(protect);

//Must come before "/:id", otherwise "/reorder" will be treated as an id.
//So, it is very important to add "/reorder" at top.
router.patch("/reorder", reorderLeads);

//We use route to chain related routes for the same resource.
//So, here we have two routes for "/leads" and two routes for "/leads/:id".
router.route("/").get(getLeads).post(createLead);
router.route("/:id").get(getLead).put(updateLead).delete(deleteLead);

export default router;