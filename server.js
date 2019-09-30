const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://mschott:bwmVdGR5EYgkglox@cluster0-lzvdg.mongodb.net/test?retryWrites=true&w=majority');
mongoose.Promise = require('bluebird');

var urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(urlencodedParser);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Here I go!



var Schema = mongoose.Schema;
var userSchema = new Schema({
  username : String ,
  _id :  Number,
  description: [String],
  duration : [Number],
  date: [String],
  log: [String],
  ex_count: Number
},{versionKey: false});

var id =0;
var User = mongoose.model('User',userSchema)
User.find().exec((err,res) =>{
  id = res.length;
})

app.use('/api/exercise/new-user',(req,res)=>{
  id ++;
  const user = new User({
    username: req.body.username,
    _id: id
  })
  res.send(user)
  user.save((err,data) => {
    if(err) {console.log("Failure at saving");}
  })
})

app.use('/api/exercise/users',(req,res)=>{
 var showUsers = new Array();
  for(let i= 1; i<(id+1); i++){
     User.findById(i,(err,data)=>{
      if(err) console.log("Failure at finding user")
      showUsers.push(data);
       if(showUsers.length === id){
         res.send(showUsers)
       }
    })
  }
})
app.use('/api/exercise/add',(req,res)=>{
  User.findById(req.body.userId,(err,data)=>{
    if(err) console.log(err);
    data.description.push(req.body.description)
    data.duration.push(req.body.duration)
    if(req.body.date){
      data.date.push(req.body.date)
    } else {
      var today = new Date();
      var current_date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      data.date.push(current_date);
    }
    data.save((err,data) => {
    if(err) {console.log("Failure at saving");}
    res.send(data)
  })
  })
})

app.use('/api/exercise/log',(req,res)=>{
  User.findById(req.query.userId,(err,data)=>{
    if(err) return err;
    let log_message = "";
    let from,to = "";
    let limit = 99;
    data.ex_count=0;
    if(req.query.from && req.query.to){
      from = new Date(req.query.from);
      to = new Date(req.query.to);
    }
    if(req.query.limit){
      limit = req.query.limit;
    }
    if(!from && !to){
      for(let i=0;(i<data.description.length) && data.ex_count < limit ;i++){
      log_message = "Exercise: " + data.description[i] + ". Duration: " + data.duration[i] + ". Date: " + data.date[i] + "."
      data.log.push(log_message)
      data.ex_count ++;
    }} else {
      for(let i=0;i<data.description.length && data.ex_count<limit;i++){
        let today = new Date(data.date[i])
        if(today>from && today<to){
          log_message = "Exercise: " + data.description[i] + ". Duration: " + data.duration[i] + ". Date: " + data.date[i] + "."
          data.log.push(log_message)
          data.ex_count ++;
        }
    } 
  }
      res.send(data)
})
})


//Here I stop!

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
