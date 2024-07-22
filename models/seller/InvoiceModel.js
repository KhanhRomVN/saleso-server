const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "invoices";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  email: Joi.string().required(),
  username: Joi.string().required(),
  order_id: Joi.string().required(),
  issue_date: Joi.date().default(Date.now),
  total_amount: Joi.number().min(0).required(),
  payment_status: Joi.string().valid("unpaid", "paid").required(),
  invoice_status: Joi.string()
    .valid("pending", "accepted", "refused")
    .required(),
  currency: Joi.string().required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateInvoice = (invoiceData) => {
  const { error } = COLLECTION_SCHEMA.validate(invoiceData);
  if (error) throw error;
};

const addToInvoice = async (invoiceData) => {
  const db = getDB();
  try {
    validateInvoice(invoiceData);
    const result = await db.collection(COLLECTION_NAME).insertOne(invoiceData);
    return result.insertedId;
  } catch (error) {
    console.error("Error adding invoice:", error);
    throw error;
  }
};

const getListInvoice = async (seller_id) => {
  const db = getDB();
  try {
    return await db
      .collection(COLLECTION_NAME)
      .find({ seller_id: seller_id })
      .toArray();
  } catch (error) {
    console.error("Error getting list of invoices:", error);
    throw error;
  }
};

const getInvoiceById = async (invoice_id) => {
  const db = getDB();
  try {
    return await db
      .collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(invoice_id) });
  } catch (error) {
    console.error("Error getting invoice by ID:", error);
    throw error;
  }
};

const getListInvoiceByStatus = async (seller_id, status) => {
  const db = getDB();
  console.log(seller_id);
  console.log(status);
  try {
    return await db
      .collection(COLLECTION_NAME)
      .find({ seller_id: seller_id, invoice_status: status })
      .toArray();
  } catch (error) {
    console.error(`Error getting list of ${status} invoices:`, error);
    throw error;
  }
};

const updateInvoiceStatus = async (
  invoice_id,
  new_invoice_status,
  deliver_status
) => {
  const db = getDB();
  try {
    await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(invoice_id) },
      {
        $set: {
          invoice_status: new_invoice_status,
          deliver_status: deliver_status,
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );
  } catch (error) {
    console.error("Error updating invoice status:", error);
    throw error;
  }
};

module.exports = {
  addToInvoice,
  getListInvoice,
  getInvoiceById,
  getListInvoiceByStatus,
  updateInvoiceStatus,
};
