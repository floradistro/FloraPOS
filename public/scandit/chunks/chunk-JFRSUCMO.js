var e={SINGLE_IMAGE_UPLOADER_CONTAINER:"scandit-single-image-uploader-container"},t={SINGLE_IMAGE_UPLOADER_CONTAINER_STYLE:{backgroundColor:"#FFFFFF"},SINGLE_IMAGE_UPLOADER_ICON_STYLE:{fill:"#121619"},SINGLE_IMAGE_UPLOADER_INFORMATION_STYLE:{color:"#121619",marginBottom:"2em"},SINGLE_IMAGE_UPLOADER_BUTTON_STYLE:{color:"#FFFFFF",backgroundColor:"#121619",fontWeight:"bold",padding:"1.25em",width:"12em",textAlign:"center",textTransform:"uppercase"}},E=`
  .${e.SINGLE_IMAGE_UPLOADER_CONTAINER} {
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .${e.SINGLE_IMAGE_UPLOADER_CONTAINER} label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .${e.SINGLE_IMAGE_UPLOADER_CONTAINER} label input[type="file"] {
    position: absolute;
    top: -9999px;
  }

  .${e.SINGLE_IMAGE_UPLOADER_CONTAINER} label div {
    user-select: none;
  }

  .${e.SINGLE_IMAGE_UPLOADER_CONTAINER} label input[type="file"]:disabled + div {
    opacity: 0.5;
  }
`;export{e as a,t as b,E as c};