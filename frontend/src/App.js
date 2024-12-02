import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import Avatar from "./Component/Avatar";
import ReactDOM from "react-dom/client"
import { FaMicrophoneSlash } from "react-icons/fa6";
import { IoIosMic } from "react-icons/io";
import "./App.css";
function App() {
  const [socket, setSocket] = useState(null);
  const [myPeerID, setMyPeerID] = useState(null);
  const [roomId, setRoomId] = useState(20);
  const [peer, setPeer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [peerScreen,setPeerScreen] = useState(null)
  const [isRoom, setIsRoom] = useState(false);
  const [toggleMic,setToggleMic]= useState(false)
  const [toggleCamera,setToggleCamera]= useState(false)
  const VideoRef = useRef({}); //Object lưu trữ tài liệu video theo userId
  const [peerInRooms, setPeerInRoom] = useState({}); // Object lưu trữ peer connection by userId
  const [shareScreenTrack, setShareScreenTrack] = React.useState(null);
  const [fullScreen,setFullScreen] = React.useState()
  useEffect(() => {
    const newSocket = io.connect("http://localhost:5000/", {
      // connect to socket Server
      transports: ["websocket"],
    });
    setSocket(newSocket);
    newSocket.on("createRoomResponse", (idRoom) => {
      // bắt sự kiện khi được tạo phòng
      setRoomId(idRoom); // set idPhong moi được tạo vào state
      console.log(idRoom);
    });
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    
    if (socket && myStream) {
      // socket.on("toggleCameraInRoom", (idUser, isActiveCamera) => {
      //   // bắt sự kiện khi ai đó trong phòng tắt Camera
      //   console.log(`User ${idUser} toggled camera: ${isActiveCamera}`);
      //   const VideoTrack = VideoRef.current[idUser].getVideoTracks()[0];
      //   if (VideoTrack) {
      //     VideoTrack.enabled = isActiveCamera;
      //   } else {
      //     console.error(`Video track for user not found.`);
      //   }
      // });

      socket.on("toggleMicInRoom", (idUser, isActiveMic) => {
        // bắt sự kiện khi ai đó trong phòng tắt Mic
        console.log(`User ${idUser} toggled camera: ${isActiveMic}`);
        const AudioTrack = VideoRef.current[idUser].getAudioTracks()[0];
        if (AudioTrack) {
          AudioTrack.enabled = isActiveMic;
        } else {
          console.error(`Video track for user not found.`);
        }
      });
      
    }
  }, [socket, myStream]); // thay đổi khi có peer hoặc soket mới

  useEffect(() => {
    if (socket) {
      socket.on("user-connected", (userId) => {
        // bắt sự kiện
        console.log("User connected:", userId);
        if (peer) {
          try {
            navigator.mediaDevices
            .getUserMedia({
              // kết nối tới Devices tại đường dẫn
              video: true, // Bật video
              audio: true, // bật mic
            })
            .then((stream) => {
              connectToNewUser(userId, stream, peer); // thực hàm kết nối tới người dùng mới
            });
          } catch (error) {
            console.log(error)
          }
        }
      });
      
    }
  }, [myStream, peer, socket,myPeerID]);
  useEffect(()=>{
    if (socket) {
      socket.on("shareScreenInRoom",(idUser)=>{
        console.log(peerInRooms[idUser])
        if (peer && idUser !== myPeerID) {
          console.log("vao day")
         navigator.mediaDevices.getUserMedia({video:true,audio:false}).then(stream=>{
          UserShareScreen(idUser,peer,stream)
         })
        }
      })
    }
  },[peerScreen,peer,socket,myPeerID,shareScreenTrack])


  const ViewFullScreen = (getUserID)=>{
    const userID = getUserID()
    document.querySelectorAll('video').forEach(video =>{
      video.style.width = '100px'
      video.style.height = '100px'
    })
    const videoFullScreen = document.querySelector(`video[data-userid="${userID}"]`)
    videoFullScreen.parentElement.style.width='900px'
    videoFullScreen.parentElement.style.height='600px'
  }


  const handleCreateRoom = () => {
    const myPeer = new Peer({
      host: 'localhost',
      port:9000, // Sử dụng cho HTTPS
      // secure:true, // Bat HTTPS
      path: '/'
    }); // Tạo và kết nối tới Peer
    setPeer(myPeer); // set Peer mới được tạo vào state
    myPeer.on("open", (id) => {
      // bật kết nối tới sever Peer
      try {
        setMyPeerID(id); // set ID của máy khi kết nối tới Sever Peer
      } catch (error) {
        console.log(error);
      }
      if (socket) {
        socket.emit("createRoom", id); // Tạo phòng mới
        setupVideoStream(myPeer, id);
      }
    });
    setIsRoom(true);
  };
  const handleJoinRoom = () => {
    const myPeer = new Peer({
      host: 'localhost',
      port:9000, // Sử dụng cho HTTPS
      // secure:true, // Bat HTTPS
      path: '/'
    }); // Tạo và kết nối tới Peer
    setPeer(myPeer); // set Peer mới được tạo vào state
    myPeer.on("open", (id) => {
      // bật kết nối tới sever Peer
      console.log("My peer ID is: " + id);
      try {
        setMyPeerID(id); // set ID của máy khi kết nối tới Sever Peer
      } catch (error) {
        console.log(error);
      }
      if (socket) {
        socket.emit("joinRoom", id, roomId);
        setupVideoStream(myPeer, id);
      }
    });
    setIsRoom(true);
  };
  const setupVideoStream = (peer, peerId) => {
    try {
      navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        const myVideo = document.createElement("video");
        myVideo.muted = true;
        setMyStream(stream);
        if (!VideoRef.current[peerId]) {
          VideoRef.current[peerId] = stream; // gán stream của user vào Object VideoRef
          addVideoStream(myVideo, stream, peerId);
        }
        peer.on("call", (call) => {
          call.answer(stream);
          const video = document.createElement("video");
          call.on("stream", (userVideoStream) => {
            if (!VideoRef.current[call.peer]) {
              addVideoStream(video, userVideoStream, call.peer);
              VideoRef.current[call.peer] = userVideoStream; // call.peer: lay idPeer của những người tham gia trong phòng
            }
          });
        });
      });
    } catch (error) {
      console.log(error)
    }
   };
  const setUpUserShareScreen = (peer,peerId,streamScreen)=>{

      const video = document.createElement("video");
      video.muted = true
      if(!VideoRef.current[peerId]){
        VideoRef.current[peerId] = streamScreen
        addVideoStream(video,streamScreen,myPeerID)
      }
      peer.on("call",(call)=>{
        call.answer(streamScreen);
        const video = document.createElement("video")
        call.on("stream",(userVideoStream)=>{
          if(!VideoRef.current[call.peer]){
            addVideoStream(video,userVideoStream,call.peer)
            VideoRef.current[call.peer] = userVideoStream
          }
        })
      })
    
  }
  const connectToNewUser = (userId, stream, peer) => {
    if (userId && !peerInRooms[userId]) {
      const call = peer.call(userId, stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        if (!VideoRef.current[userId]) {
          addVideoStream(video, userVideoStream, userId);
          VideoRef.current[userId] = userVideoStream;
        }
      });
      call.on("close", () => {
        handleCallClose(userId);
      });
      console.log("peerConnection", call.peerConnection);
      if (call.peerConnection) {
        setPeerInRoom((prePeer) => ({
          ...prePeer,
          [userId]: {
            call,
            peerConnection: call.peerConnection,
            senders: call.peerConnection.getSenders(),
          }, // Lưu cả `call` và `peerConnection`
        }));
      } else {
        console.error(`PeerConnection not found for user ${userId}`);
      }
    } else {
      console.error(`Invalid userId: ${userId}`);
    }
  };
  const UserShareScreen = (userId,peer,stream)=>{
    console.log("userID:",userId)
    console.log("stream",stream)
    if(userId && peer && peer.call){
      const call = peer.call(userId,stream)
      console.log(call)
        call.on("stream",(userVideoStream)=>{
          const video = document.createElement("video")
          console.log("Stream In ShareScreen" , userVideoStream)
          if(!VideoRef.current[userId]){
            addVideoStream(video,userVideoStream,userId)
            VideoRef.current[userId] = userVideoStream
          }
        })
        call.on("close",()=>{
          handleCallClose(userId)
        })
    }
  }
  const addVideoStream = (video, stream, userId) => {
    // video.srcObject = stream;
    // video.addEventListener("loadedmetadata", () => {
    //   video.play();
    // });
    // video.setAttribute("data-userId", userId);
    const container = document.createElement("div")
    container.id = userId
    document.getElementById("gridVideo").append(container)
    const gridVideo = ReactDOM.createRoot(container)
    gridVideo.render(
      <Avatar stream={stream} ViewFullScreen={ViewFullScreen} viewFullScreen={ViewFullScreen} hanldeShareScreen={hanldeShareScreen} myPeerID={myPeerID} socket={socket} userId={userId} />
    )
    // ReactDOM.render( <Avatar stream={stream} userId={userId} />,document.getElementById("gridVideo"))
    // document.getElementById("gridVideo").append(video);
  };

  const handleCallClose = (userId) => {
    setPeerInRoom((prevPeers) => {
      const updatedPeers = { ...prevPeers };
      delete updatedPeers[userId];
      return updatedPeers;
    });
  };

  const hanldeToggleCamera = () => {
    if (myStream) {
      const VideoTrack = myStream.getVideoTracks()[0];
       const videoFullScreen = document.querySelector(`video[data-userid="${myPeerID}"]`)
       videoFullScreen.classList.toggle('off')
      VideoTrack.enabled = !VideoTrack.enabled;
      if (socket) {
        socket.emit("toggleCamera", myPeerID, 20, VideoTrack.enabled);
      }
    }
  };
  const hanldetoggleMic = () => {
    if (myStream) {
      setToggleMic(!toggleMic)
      const audioTrack = myStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      if (socket) {
        socket.emit("toggleMic", myPeerID, 20, audioTrack.enabled);
      }
    }
  };
  const hanldeShareScreen = async () => {
    const peerStream = new Peer({
      host: 'localhost', //0.peerjs.com
      port:9000, // Sử dụng cho HTTPS
      // secure:true, // Bat HTTPS
      path: '/'
    }); // Tạo và kết nối tới Peer
    setPeerScreen(peerStream)
    peerStream.on("open",async (id)=>{
      const streamScreen = await navigator.mediaDevices.getDisplayMedia({video:true})
      setShareScreenTrack(streamScreen) // Luu lai man hinh chia se
      socket.emit("shareScreenInRoom",id,roomId)
      setUpUserShareScreen(peerStream,id,streamScreen)
    }) 
  };
  return (
    <div className="App">
      {isRoom === false && (
        <div className="function">
          <button onClick={handleCreateRoom}>Create Room</button>
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      )}
      {isRoom === true && (
        <div className="function">
          <button onClick={hanldeShareScreen}>Share Screen</button>
          <button onClick={hanldetoggleMic}>{toggleMic ? <FaMicrophoneSlash/> : <IoIosMic/>}</button>
          <button onClick={hanldeToggleCamera}>Toggle Camera</button>
        </div>
      )}
      <div id="gridVideo"></div>
    </div>
  );
}

export default App;
