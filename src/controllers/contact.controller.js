const { createContactMessage } = require("../models/contact.model");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_LIMITS = {
  name: 100,
  email: 254,
  subject: 150,
  message: 2000,
};

// Server-side validation for the public contact form
const validateContactPayload = (body = {}) => {
  const errors = [];

  const name = String(body.name || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();

  if (!name) errors.push("Name is required.");
  if (name.length > FIELD_LIMITS.name)
    errors.push(`Name must be at most ${FIELD_LIMITS.name} characters.`);

  if (!email) errors.push("Email is required.");
  else if (!EMAIL_REGEX.test(email) || email.length > FIELD_LIMITS.email)
    errors.push("A valid email address is required.");

  if (!subject) errors.push("Subject is required.");
  if (subject.length > FIELD_LIMITS.subject)
    errors.push(`Subject must be at most ${FIELD_LIMITS.subject} characters.`);

  if (!message) errors.push("Message is required.");
  else if (message.length < 10)
    errors.push("Message must be at least 10 characters.");
  if (message.length > FIELD_LIMITS.message)
    errors.push(`Message must be at most ${FIELD_LIMITS.message} characters.`);

  return { errors, payload: { name, email, subject, message } };
};

const submitContactMessage = async (req, res) => {
  try {
    const { errors, payload } = validateContactPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
        errors,
      });
    }

    const now = new Date().toISOString();
    const contactDocument = {
      ...payload,
      status: "new",
      createdAt: now,
    };

    const result = await createContactMessage(contactDocument);

    return res.status(201).json({
      success: true,
      message: "Your message has been received. We'll get back to you soon.",
      data: { _id: result.insertedId },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to submit your message.",
    });
  }
};

module.exports = {
  submitContactMessage,
};
