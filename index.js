require("dotenv").config()
const io = require("socket.io")(8900, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
})
console.log("urll-", process.env.BACKEND_URL)
let users = []

let videoUsers = []

let notificationUsers = []

const addVideoUser = (userId, socketId) => {
  !videoUsers.some((user) => user.userId === userId) &&
    videoUsers.push({ userId, socketId })
}

const removeVideoUser = (socketId) => {
  videoUsers = videoUsers.filter((user) => user.socketId !== socketId)
}

const getVideoUser = (userId) => {
  return videoUsers.find((user) => user.userId === userId)
}

//notificationUser
const addNotificationUser = (userId, socketId) => {
  !notificationUsers.some((user) => user.userId === userId) &&
    notificationUsers.push({ userId, socketId })
}

const removeNotificationUser = (socketId) => {
  notificationUsers = notificationUsers.filter(
    (user) => user.socketId !== socketId
  )
}

const getNotificationUser = (userId) => {
  return notificationUsers.find((user) => user.userId === userId)
}

//active user

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId })
}

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId)
}

const getUser = (userId) => {
  console.log("users-", users)
  console.log(
    "return value",
    users.find((user) => user.userId === userId)
  )
  return users.find((user) => user.userId === userId)
}

io.on("connection", (socket) => {
  //when connect
  console.log("a user connected", socket.id)
  //take userId and socketId from user
  socket.emit("me", socket.id)

  socket.on("addUser", (userId) => {
    console.log("addUser userId=", userId)
    addUser(userId, socket.id)
    console.log("adduser user[]", users)
    //sending online users
    io.emit("getUsers", users)
  })

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    console.log("senderid-", senderId, "receiverid-", receiverId, "text-", text)
    const user = getUser(receiverId)
    console.log("user-", user)
    const notification = getNotificationUser(receiverId)
    console.log("noti-", notification)
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
      })
    }
    if (notification) {
      io.to(notification.socketId).emit("getNotification", {
        senderId,
        text,
      })
    }
  })

  //---------------------Notification--------------------------
  socket.on("addNotificationUser", (userId) => {
    console.log("notification userId=", userId)
    addNotificationUser(userId, socket.id)
    console.log("notification user[]", notificationUsers)
    //sending online users
    io.emit("getNotificationUsers", notificationUsers)
  })
  //---------------------Notification-End--------------------------

  //call

  //video call list will needed because socket id is changing
  socket.on("addVideoUser", (userId) => {
    console.log("addVideoUser userId=", userId)
    addVideoUser(userId, socket.id)
    console.log("addVideouser Videouser[]", videoUsers)
    //sending online users
    io.emit("getVideoUsers", videoUsers)
  })

  //working code

  // socket.on("callUser", (data) => {
  //   console.log("data.from- ", data.from)
  //   console.log("data.userToCall-", data.userToCall)
  //   io.to(data.userToCall).emit("callUser", {
  //     signal: data.signalData,
  //     from: data.from,
  //     name: data.name,
  //   })
  // })

  socket.on("callUser", (data) => {
    console.log("data.receiverId- ", data.recieverId)
    console.log("data.userToCall-", data.callerId)
    const reciever = getVideoUser(data.recieverId)
    const caller = getVideoUser(data.callerId)
    console.log("reciever-", reciever, "caller-", caller)
    io.to(reciever.socketId).emit("callUser", {
      signal: data.signalData,
      from: caller.socketId,
      name: data.name,
    })
  })

  socket.on("answerCall", (data) => {
    console.log("call accepted from ", data.to)
    io.to(data.to).emit("callAccepted", data.signal)
  })

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id)
    removeUser(socket.id)
    removeVideoUser(socket.id)
    removeNotificationUser(socket.id)
    io.emit("getUsers", users)
    io.emit("getVideoUsers", videoUsers)
    io.emit("getNotificationUsers", notificationUsers)
  })
})
