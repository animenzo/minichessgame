const express = require('express')
const socket = require('socket.io')
const http = require("http")
const {Chess} = require('chess.js')
const path = require('path')
const app = express()


//imp lines for socket io implementation 
//http ka server express k app var se link kr dya 
const server = http.createServer(app)
const io = socket(server)


const chess = new Chess()
let players = {}
let currentPlayer = "w";

app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,"public")))
app.set("views", path.join(__dirname, "views"));


app.get("/",function(req,res){
    res.render("index",{title: "Chess game"})
})

io.on("connection",function(uniquesocket){
console.log("connected");

if(!players.white){
    players.white = uniquesocket.id
    //jo player abhi connect hua h 
    uniquesocket.emit("playerRole","w")
}else if(!players.black){
    players.black = uniquesocket.id
    uniquesocket.emit("playerRole","b")
}else{
    uniquesocket.emit("spectatorRole")
}

uniquesocket.on("disconnect",function(){
    if(uniquesocket.id === players.white){
        delete players.white
    }else if(uniquesocket.id === players.black){
        delete players.black
    }
})

//frontend se move event bhejenge jb bhi koi piece move hoga 
uniquesocket.on("move",function(move){
    //necesasity to use try catch otherwise server will crash
    try {

        //we are making sure that our player move right pieces of its own 
        if(chess.turn()  === 'w' && uniquesocket.id !== players.white) return ;
        if(chess.turn()  === 'b' && uniquesocket.id !== players.black) return ;

        const result = chess.move(move)

        if(result){
            currentPlayer = chess.turn()
            //BE se move ko vaaps bhej diya 
            io.emit("move",move)
            //io.emit means basically sbko msg bhejna ki bhai woh admi move ho gya h i.e braodcasting  on frontend

            io.emit("broadState",chess.fen())
        //chess ki current state pahch jayegi
        }else{
            console.log('invalid move',move);
            uniquesocket.emit("invalidMove",move)
            
        }
    } catch (error) {
        console.log(error);
        uniquesocket.emit("invalid move",move);
    }
})

})


server.listen(3000,function(){
    console.log("Server working on 3000");
    
})

