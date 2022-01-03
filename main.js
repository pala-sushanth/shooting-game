var PREFIX = "c6d446e6-3744-11ec-8d3d-0242ac130003";
var SUffIx = "b485aa30-3752-11ec-8d3d-0242ac130003";
var connections=[],started=false,peer,myId,messages=[],currentRound="1",yours={
    win:0,loss:0,
    rounds:{
        "1":{score:0,result:"",health:100},"2":{score:0,result:"",health:100},"3":{score:0,result:"",health:100},"4":{score:0,result:"",health:100},"5":{score:0,result:"",health:100}
    }
},others={...yours},conn=null,host=true,GameControl = null,reloadGun=false,isCompleted=false;
var counts=0;
const modal = new tingle.modal({
    footer: false,
    stickyFooter: false,
    closeMethods: ['overlay', 'button', 'escape'],
    closeLabel: "Close",
    cssClass: ["custom-modal"],
    onOpen: function() {
        console.log('modal opened');
    },
    onClose: function() {
        const props = new createjs.PlayPropsConfig().set({interrupt: createjs.Sound.INTERRUPT_ANY, loop: -1, volume: 1.0});
        createjs.Sound.play("waiting_bgm",props);
        fetch("https://0.peerjs.com").then((r)=>r.json()).then((res)=>{
        }).catch((err)=>{
            alert("Disable add blocker to allow the game.");
        });
    }
});
document.addEventListener('DOMContentLoaded',()=>{
    addDefaultDomHandlers();
    myId = makeid();
    const peerJs = new Peer(PREFIX+myId+SUffIx);
    peerJs.on('open', (id) => {
        peer = peerJs;
        // show myId
        document.querySelector("#invite-id").value=myId;
        document.querySelector(".join-btn").addEventListener("click",()=>{
        var connectId = document.querySelector("#join-id").value;
        if(connectId && connectId.trim().length>0){
            conn = peer.connect(PREFIX+connectId+SUffIx);
            conn.on('open', (id) => {
              const msgObj = {
                sender: myId,
                message: 'Hello',
                type: "joined"
              };
              connections.push(id);
              host=false;
              conn.send(msgObj);
              messages.push(msgObj);
            });
            conn.on('data', (data) => {
                messages.push(data);
                console.log(data);
                if(!started){
                    prepareGame(conn,data.sender);
                }
                handleMessages(data,conn);
            });
            conn.on('close',()=>{
                alert("Player Left");
            });
            conn.on('error',()=>{
                alert("Error connection!");
            });
        }
        else{
            alert("ID required :(");
        }
    });
});
// 
    peerJs.on('connection', (c) => {
        conn=c;
        if(connections.length>0){
            const msgObj = {
                sender: myId,
                message: 'hi'
              };
            conn.close();
            return;
        }
        connections.push(conn.peer);
      conn.on('data', (data) => {
          if(host){
          messages.push(data);
          console.log(data);
          handleMessages(data,conn);
          }
      });
    });
});

function handleMessages(data,conn){
    if(data.hasOwnProperty('type')){
        const type = data.type;
        const msg = {
            sender: myId,
            message: "Welcome, buddy!",
            type:"ready"
        };
        if(type==="joined"){
            conn.send(msg);
            prepareGame(conn,data.sender);
            return;
        }
        if(type==="ready"){
            triggerReady();
            conn.send({...msg,type:"start",message:"Game starts in 3 sec!"});
            return;
        }
        if(type==="start"){
            triggerReady();
            return;
        }
        if(type==="shoot"){
            GameControl.shootToMe();
            return;
        }
    }
}
function triggerReady(){
    // alert("Game starts in 3 sec!");
    createjs.Sound.stop();
}
function makeid() {
    var text = "";
    // var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }
  function prepareGame(conn,senderId){
    //   close waiting area
      document.querySelector(".waiting-area").style.display = "none";
      yours.id = myId;
      others.id = senderId;
      console.log(`YourId:${yours.id} & others:${others.id}`);
      document.querySelector(".timer-game").style.display = "inherit";
      document.querySelector(".timer-game").innerHTML=3;
      const updateTime = (time)=>{
          if(time<-1){
              document.querySelector(".timer-game").style.display = "none";
              document.querySelector(".game-popup").style.display = "none";
              started=true;
              GameControl = new addGameControls(conn,senderId);
              return;
          }
          if(time==-1){
              document.querySelector(".timer-game").innerHTML="START";
          }else{
              document.querySelector(".timer-game").innerHTML=time;
          }
        setTimeout(()=>{updateTime(time-1)},1000);
      }
      setTimeout(()=>{updateTime(2)},2000);
  }
  function addDefaultDomHandlers(){
      this.copyId = ()=>{
            const copyText = document.querySelector("#invite-id");
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value);
            console.log(copyText.value);
      }
    //   copy id
      document.querySelector("#copy-btn").addEventListener("click",()=>this.copyId());
      document.querySelector("#copy-btn").removeEventListener("click",()=>this.copyId);
      document.querySelector("#invite-id").addEventListener("click",()=>this.copyId());
      document.querySelector("#invite-id").removeEventListener("click",()=>this.copyId);
      loadSounds();
      showPermissions();
  }

  function  showPermissions() {
      modal.setContent(`
      <h1 style="text-align: center;color: #016201;margin-top: -15px;font-family: fantasy;">Welcome To Shooter 🔫</h1>
      <p><h3 style="color: #cae6a5;">T&C:</h3>
      Plays audio during the game please allow the audio permissions and enjoy the game.
      Turn Off any add blocker to play the game.Use chrome or edge browser only.
      </p>
      `);
   modal.open();
  }
  function getTIme() {
      let d= new Date();
      d=d.getTime();
      return d;
  }
  function addGameControls(c,senderId){
      this.shootOther = ()=>{
          if(isCompleted){
              return;
          }
          if(reloadGun){
              return;
          }
          const msg = {
              type:"shoot",
              message:"shooting",
              timestamp:getTIme(),
              sender: myId
          };
          reloadGun=true;
          conn.send(msg);
          counts++;
          console.log(`I shoot at ${others.id}`);
          document.querySelector(".your-bullet").style.display="inline";
          //   animate bullet shooting from me to other
          setTimeout(()=>{
            document.querySelector(".your-bullet").classList.add("move");
            const props = new createjs.PlayPropsConfig().set({interrupt: createjs.Sound.INTERRUPT_ANY, loop: 0, volume: 1.0});
            createjs.Sound.play("shoot",props);
          },1);
        //   reload now
          setTimeout(()=>{
            const props = new createjs.PlayPropsConfig().set({interrupt: createjs.Sound.INTERRUPT_ANY, loop: 0, volume: 1.0});
            createjs.Sound.play("reload",props);
            reloadGun=false;
          },500);
          
          setTimeout(()=>{
            document.querySelector(".your-bullet").classList.remove("move");
            document.querySelector(".your-bullet").style.display="none";
            yours.rounds[currentRound].score+=10;
            others.rounds[currentRound].health-=10;
            others.rounds[currentRound].score-=10;
            const your_health = yours.rounds[currentRound].health;
            const other_health = others.rounds[currentRound].health;
            // document.querySelector(":root").style.setProperty("--current-player-health",your_health+"%");
            document.querySelector(":root").style.setProperty("--other-player-health",other_health+"%");
            if(others.rounds[currentRound].health<=0){
                currentRound=(parseInt(currentRound)+1)+"";
                yours.win+=1;
                others.loss+=1;
                others.rounds[currentRound].result="LOSS";
                yours.rounds[currentRound].result="WIN";
                document.querySelector("#player1-wins").innerHTML=yours.win;
                document.querySelector("#player2-losses").innerHTML=others.loss;
                if(yours.win===3){
                    showResults();
                }
                if(currentRound=="6"){
                    showResults();
                    started=false;
                    return;
                }
                document.querySelector(":root").style.setProperty("--other-player-health","100%");
                document.querySelector("#round-status").innerHTML=currentRound;
                return;
            }
            
        },500);
      }
      this.shootToMe = ()=>{
        if(isCompleted){
            return;
        }
          console.log(`${others.id} shooted me`);
          document.querySelector(".other-bullet").style.display="inline";
        //   animate bullet shooting towards me
        setTimeout(()=>{
            document.querySelector(".other-bullet").classList.add("move");
            const props = new createjs.PlayPropsConfig().set({interrupt: createjs.Sound.INTERRUPT_ANY, loop: 0, volume: 1.0});
            createjs.Sound.play("shoot",props);
        },1);
        
        setTimeout(()=>{
            document.querySelector(".other-bullet").classList.remove("move");
            document.querySelector(".other-bullet").style.display="none";

            yours.rounds[currentRound].score-=10;
            yours.rounds[currentRound].health-=10;
            others.rounds[currentRound].score+=10;
            const your_health = yours.rounds[currentRound].health;
            const other_health = others.rounds[currentRound].health;
            document.querySelector(":root").style.setProperty("--current-player-health",your_health+"%");
            // document.querySelector(":root").style.setProperty("--other-player-health",other_health+"%");
            if(yours.rounds[currentRound].health<=0){
                currentRound=(parseInt(currentRound)+1)+"";
                yours.loss+=1;
                others.win+=1;
                yours.rounds[currentRound].result="LOSS";
                others.rounds[currentRound].result="WIN";
                document.querySelector("#player1-losses").innerHTML=yours.loss;
                document.querySelector("#player2-wins").innerHTML=others.win;
                if(others.win === 3){
                    showResults();
                    return;
                }
                if(currentRound=="6"){
                    showResults();
                    started=false;
                    return;
                }
                document.querySelector(":root").style.setProperty("--current-player-health","100%");
                document.querySelector("#round-status").innerHTML=currentRound;
                return;
            }
        },500);
      }
      document.querySelector("#fire-btn").addEventListener("click",()=>this.shootOther());
    //   document.querySelector("#fire-btn").removeEventListener("click",()=>this.shootOther());
      document.addEventListener("keydown", (event)=> {
        if(event.code=="Enter"){
            this.shootOther();
        }
      });
  }

function showResults() {
    if(yours.win>others.win){
        alert("You won");
    }
    else{
        alert("You Lost");
    }
    isCompleted=true;
    window.location.reload();
}

  function loadSounds() {
    createjs.Sound.registerSound("sounds/Battlefield 2142.mp3", "waiting_bgm");
    createjs.Sound.registerSound("sounds/shoot2.mp3", "shoot");
    createjs.Sound.registerSound("sounds/Battlefield 1 Reload.mp3", "reload");
    createjs.Sound.registerSound("sounds/round_bell.mp3", "round");
  }