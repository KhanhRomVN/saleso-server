const { ConversationModel, MessageModel } = require("../../models/index");

//* For User Conservation
const getAllUserMessage = async (req, res) => {
  const { receiver_id } = req.body;
  const sender_id = req.user._id.toString();
  try {
    const chat = await ConversationModel.findUserChatId(sender_id, receiver_id);
    const conservation_id = chat._id.toString();
    const messageList = await MessageModel.getAllMessage(conservation_id);
    return res.status(200).json({ conservation_id, messageList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal getChatBox error" });
  }
};

const getAllUserImage = async (req, res) => {
  const { receiver_id } = req.body;
  const sender_id = req.user._id.toString();
  try {
    const chat = await ConversationModel.findUserChatId(sender_id, receiver_id);
    const conservation_id = chat._id.toString();
    const messageList = await MessageModel.getAllImage(conservation_id);
    const imageList = messageList.map((message) => message.image);
    return res.status(200).json({ conservation_id, imageList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal getChatBox error" });
  }
};

const getLastMessage = async (req, res) => {
  const { receiver_id } = req.body;
  const sender_id = req.user._id.toString();
  try {
    const chat = await ConversationModel.getChatBox(sender_id, receiver_id);
    const last_message = chat.last_message;
    return res.status(200).json({ last_message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal getChatBox error" });
  }
};

//* For Group Conservation
const createGroupChat = async (req, res) => {
  const user_id = req.user._id.toString();
  const { groupName, listUserId } = req.body;
  listUserId.push(user_id);
  try {
    await ConversationModel.createGroupChat(user_id, groupName, listUserId);
    return res.status(201).json({ message: "Create Group Chat Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal createGroupChat error" });
  }
};

const getListGroupChat = async (req, res) => {
  const user_id = req.user._id.toString();
  try {
    const groupChats = await ConversationModel.getListGroupChat(user_id);
    return res.status(200).json(groupChats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal getListGroupChat error" });
  }
};

const getAllGroupMessage = async (req, res) => {
  const { group_id } = req.body;
  try {
    const allMessageGroup = await MessageModel.getAllMessage(
      group_id.toString()
    );
    return res.status(200).json(allMessageGroup);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal getAllGroupMessage error" });
  }
};

const getAllGroupImage = async (req, res) => {
  const { group_id } = req.body;
  try {
    const messageList = await MessageModel.getAllImage(group_id.toString());
    const imageList = messageList.map((message) => message.image);
    return res.status(200).json({ imageList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal getChatBox error" });
  }
};

const updateGroup = async (req, res) => {
  const { group_id, group_avatar, group_name } = req.body;
  try {
    if (group_avatar) {
      await ConversationModel.updateGroupAvatar(group_id, group_avatar);
    }
    if (group_name) {
      await ConversationModel.updateGroupName(group_id, group_name);
    }
    return res.status(200).json({ message: "Group updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal updateGroup error" });
  }
};

const deleteGroupChat = async (req, res) => {
  const { groupId } = req.body;
  try {
    await ConversationModel.deleteGroupChat(groupId);
    return res.status(200).json({ message: "Group chat deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal deleteGroupChat error" });
  }
};

const addUserGroup = async (req, res) => {
  const { groupId, userId } = req.body;
  try {
    await ConversationModel.addUserToGroup(groupId, userId);
    return res
      .status(200)
      .json({ message: "User added to group successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal addUserGroup error" });
  }
};

const deleteUserGroup = async (req, res) => {
  const { groupId, userId } = req.body;
  try {
    await ConversationModel.removeUserFromGroup(groupId, userId);
    return res
      .status(200)
      .json({ message: "User removed from group successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal deleteUserGroup error" });
  }
};

module.exports = {
  getAllUserMessage,
  getAllUserImage,
  getLastMessage,
  createGroupChat,
  getListGroupChat,
  getAllGroupMessage,
  getAllGroupImage,
  updateGroup,
  deleteGroupChat,
  addUserGroup,
  deleteUserGroup,
};
