import { Event } from '../models/Event.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cleanupReplacedPublicFile } from '../utils/fileCleanup.js';

export const listEvents = asyncHandler(async (req, res) => {
  const { all } = req.query;
  // See teacherController.js for why this checks req.user, not just the
  // presence of the param — req.user is only set by optionalAuth if a
  // valid admin session was actually presented (routes/eventRoutes.js).
  const filter = (all && req.user?.role === 'admin') ? {} : { isPublished: true };
  const events = await Event.find(filter).sort('date');
  res.json({ success: true, data: { items: events } });
});

export const createEvent = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) body.image = `/uploads/${req.file.filename}`;
  ['registrationRequired', 'isPublished'].forEach((k) => { if (k in body) body[k] = body[k] === 'true' || body[k] === true; });
  const event = await Event.create(body);
  res.status(201).json({ success: true, message: 'Event created', data: event });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const existing = await Event.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Event not found');
  const body = { ...req.body };
  if (req.file) body.image = `/uploads/${req.file.filename}`;
  ['registrationRequired', 'isPublished'].forEach((k) => { if (k in body) body[k] = body[k] === 'true' || body[k] === true; });
  const event = await Event.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (req.file) await cleanupReplacedPublicFile(Event, 'image', existing.image, event.image, event._id);
  res.json({ success: true, message: 'Event updated', data: event });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  await cleanupReplacedPublicFile(Event, 'image', event.image, null, event._id);
  res.json({ success: true, message: 'Event deleted' });
});
