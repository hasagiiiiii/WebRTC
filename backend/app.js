const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { v4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const corsOptions = {
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.get("/login",(req,res)=>{
    const idUser = v4()
    res.json(idUser)
})



io.on("connection", (socket) => { // connect
    const Room = 20;
    socket.on("createRoom", (idUser) => {
        
        socket.emit("createRoomResponse", Room);
        socket.join(Room)
       
    });

    socket.on("joinRoom",(idUser,roomId)=>{
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', idUser);
        console.log(`User ${idUser} joined room ${roomId}`);
    })
    socket.on("toggleCamera",(idUser,roomId,isActiveCamera)=>{
        socket.broadcast.to(roomId).emit("toggleCameraInRoom",idUser,isActiveCamera)
    })

    socket.on("toggleMic",(idUser,roomId,isActiveMic)=>{
        socket.broadcast.to(roomId).emit("toggleMicInRoom",idUser,isActiveMic)
    })
    socket.on("shareScreenInRoom",(idUser,roomId)=>{
        socket.broadcast.to(roomId).emit("shareScreenInRoom",idUser)
        console.log("User Share Screen",idUser)
    })
    // socket.on("shareScreen",(idUser,roomId,screenStream)=>{
    //     socket.broadcast.to(roomId).emit("shareScreenInRoom",idUser,screenStream)
    //     console.log("ShareScreen",screenStream)
    // })  
    // socket.on("stopShareScreen",(idUser,roomId)=>{
    //     socket.broadcast.to(roomId).emit("stopShareScreenInRoom",idUser)
    // })
    socket.on("disconnect", () => {
    });
});

server.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});
