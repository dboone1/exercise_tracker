const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });



const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "))
db.once("open", () =>{
  console.log("Connected successfully")
})

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const userSchema = mongoose.Schema({
  username: {type: String, required: true, unique: true},
  count: {type: Number, default: 0},
  log: [{
    description: {type: String, required: true},
    duration: {type: Number, requried: true},
    date: {type: String}
  }]
})



const user = mongoose.model('user', userSchema)

app.get('/api/users', (req, res) => {
  user.find({}, '-log -count', (err, data) => {
    if (!err){
      res.json(data)
    }
  })
})



app.post('/api/users', bodyParser.urlencoded({extended: false}), (req,res) => {
  const User = new user({username: req.body.username, log: []})
  User.save((err, data) => {
    if(err){
      console.log(err)
    }
    else{
      res.json({username: data.username, _id: data._id})
    }
  })
})

app.post('/api/users/:_id/exercises',bodyParser.urlencoded({extended: false}), (req,res) => {
  let date;
  
  if (req.body.date === undefined || req.body.date === ""){
    date = new Date().toDateString()
  }
  else{
    date = new Date(req.body.date).toDateString()
  }
  logObj = {description: req.body.description, duration:parseInt(req.body.duration), date: date}
  
  user.findById(req.params._id, (err, data) => {
    if (err){
      return res.json({error: "invalid id"})
    }
    else{
      data.log.push(logObj)
      data.count+=1
      data.save()
      res.json({
        username: data.username,
        description: logObj.description,
        duration: logObj.duration,
        date: date,
        _id: data._id
      })
    }
  })
  
})

app.get('/api/users/:_id/logs', (req, res) =>{

  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  
  user.findById(req.params._id, (err,data) => {
    if(err){
      return res.json({error: "invalid id"})
    }
    else{
      let logs = data.log
  
      if (from !== undefined){
        logs = logs.filter(x => new Date(x.date).getTime() >=  new Date(from).getTime())
      }
      if(to !== undefined){
        logs = logs.filter(x => new Date(x.date).getTime() <= new Date(to).getTime())
      }
      if (limit !== undefined){
        logs = logs.slice(0,limit)
      }
      return res.json({count: data.count, log: logs})
      } 
    })  
  })
  





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
