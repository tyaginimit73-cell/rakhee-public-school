import { ContactMessage } from '../models/ContactMessage.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paged } from '../utils/paginate.js';

export const submitContact = asyncHandler(async (req, res) => {
  await ContactMessage.create(req.body);
  res.status(201).json({ success: true, message: 'Thank you! Your message has been received. We will get back to you soon.' });
});

export const listMessages = asyncHandler(async (req, res) => {
  const filter = req.query.unread === 'true' ? { isRead: false } : {};
  const data = await paged(ContactMessage.find(filter).sort('-createdAt'), req, ContactMessage.countDocuments(filter));
  res.json({ success: true, data });
});

export const toggleRead = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findById(req.params.id);
  if (!msg) throw new ApiError(404, 'Message not found');
  msg.isRead = !msg.isRead;
  await msg.save();
  res.json({ success: true, message: msg.isRead ? 'Marked as read' : 'Marked as unread', data: msg });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!msg) throw new ApiError(404, 'Message not found');
  res.json({ success: true, message: 'Message deleted' });
});
