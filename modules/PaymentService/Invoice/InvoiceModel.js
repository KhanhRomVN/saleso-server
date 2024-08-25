const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "invoices";
const COLLECTION_SCHEMA = Joi.object({
  seller_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  order_id: Joi.string().required(),
  issue_date: Joi.date().default(Date.now),
  due_date: Joi.date().required(),
  invoice_status: Joi.string()
    .valid("progress", "success", "failure")
    .required(),
  logs: Joi.array().items(Joi.string()).required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateInvoice = (invoiceData) => {
  const { error } = COLLECTION_SCHEMA.validate(invoiceData);
  if (error) throw error;
};

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const InvoiceModel = {
  createInvoice: async (invoiceData) => {
    validateInvoice(invoiceData);
    return handleDBOperation(async (collection) => {
      const result = await collection.insertOne(invoiceData);
      return result.insertedId;
    });
  },

  getListInvoiceByStatus: async (seller_id, status) => {
    return handleDBOperation(async (collection) => {
      return await collection
        .find({ seller_id, invoice_status: status })
        .toArray();
    });
  },

  getInvoiceById: async (invoice_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.findOne({ _id: new ObjectId(invoice_id) });
    });
  },

  updateInvoiceStatus: async (invoice_id, newStatus) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: new ObjectId(invoice_id) },
        { $set: { invoice_status: newStatus, updated_at: new Date() } }
      );
      if (result.modifiedCount === 0) {
        throw new Error("Invoice not found or status not changed");
      }
      return { message: "Invoice status updated successfully" };
    });
  },
};

module.exports = InvoiceModel;
