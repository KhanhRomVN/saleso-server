const { getDB } = require("../../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "payments";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  seller_id: Joi.string().required(),
  order_id: Joi.string().required(),
  invoice_id: Joi.string().required(),
  payment_method: Joi.string().valid("prepaid", "postpaid").required(),
  payment_status: Joi.string()
    .valid("pending", "completed", "failed")
    .required(),
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
  // when customer create order
  createPayment: async (paymentData) => {
    return handleDBOperation(async (collection) => {
      await collection.insertOne(paymentData);
      return { message: "Create payment successful" };
    });
  },

  // when seller accepted order and create invoice
  createInvoice: async (invoice_id, order_id) => {
    return handleDBOperation(async (collection) => {
      await collection.updateOne(
        { order_id: order_id },
        {
          $set: { invoice_id },
        }
      );
      return collection.findOne({ invoice_id });
    });
  },

  // when seller refuse order and delete payment data
  refuseOrder: async (order_id) => {
    return handleDBOperation(async (collection) => {
      await collection.deleteOne({ order_id: order_id });
    });
  },

  getPayment: async (order_id) => {
    return handleDBOperation(async (collection) => {
      return await collection.findOne({ order_id: order_id });
    });
  },

  updatePaymentStatus: async (payment_id, newStatus) => {
    return handleDBOperation(async (collection) => {
      const result = await collection.updateOne(
        { _id: new ObjectId(payment_id) },
        { $set: { payment_status: newStatus, updated_at: new Date() } }
      );
      if (result.modifiedCount === 0) {
        throw new Error("Payment not found or status not changed");
      }
      return { message: "Payment status updated successfully" };
    });
  },
};

module.exports = InvoiceModel;
