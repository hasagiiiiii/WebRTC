import React from "react";
import "./index.css"
const Avatar = React.memo(
  ({ stream, userName = "T", userId, socket,ViewFullScreen }) => {
    const videoRef = React.useRef();
    const activeRef = React.useRef(true);

    React.useEffect(() => {
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener("loadedmetadata", () => {
        videoRef.current.play();
      });
      videoRef.current.setAttribute("data-userId", userId);
    }, [stream, userId]);
  
    React.useEffect(() => {
      if (socket) {
        socket.on("toggleCameraInRoom", (idUser, isActiveCamera) => {
          activeRef.current=isActiveCamera
          console.log(videoRef.current);
          if (userId === idUser) {
            // const VideoTrack = videoRef.current
            //   .captureStream()
            //   .getVideoTracks()[0];
            // if (VideoTrack) {
            //   VideoTrack.enabled = isActiveCamera;
            // } else {
            //   console.log("toggle Camera error");
            // }
            console.log(isActiveCamera);
            videoRef.current.isActiveCamera = isActiveCamera
            const videoFullScreen = document.querySelector(`video[data-userid="${idUser}"]`)
              videoFullScreen.classList.toggle('off')
            videoFullScreen.captureStream().getVideoTracks()[0].enabled = isActiveCamera
          }
          
        });
      }
    }, []);
    return (
      <div className='parenVideo' onClick={()=>ViewFullScreen(()=>userId)}>
        <video  ref={videoRef}></video>
        <div className="avartar">{userName}</div>
      </div>
    );
  }
)

export default Avatar;
