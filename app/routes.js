var express = require('express')
const util = require('util')
var getDatesInMonth = require('../lib/helper.js')

var NotifyClient = require('notifications-node-client').NotifyClient

var apiKey = process.env.NOTIFY_KEY

var notifyClient = new NotifyClient(apiKey)

var team_email = process.env.STANDARDS_TEAM_EMAIL

var mlist = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ]


var router = express.Router()

var sess;
var data;

// Route index page
router.get('/', function (req, res) {
  res.render('index')
})

// add your routes here
// Route index page
router.get('/start', function (req, res) {
  res.render('start')
})

router.post('/stage', function(req, res) {
  sess = req.session

  if (sess.user_info) {

  } else {
    //create user_info session object
    //TODO think about dealing with concurrency
    var _data = {}

    sess.user_info = _data
  }

  var name = req.body.service_manager_name
  var email = req.body.service_manager_email
  var dept = req.body.service_manager_department
  var service_name = req.body.service_name

  data = { name: name, email: email, dept: dept, service_name: service_name }
  sess.user_info = data

  console.log('\nService Manager details: ' + name + ', ' + email)
  res.render('stage')
})

router.post('/pick-date', function (req, res) {

  sess = req.session

  if (sess.user_info){
    var assessment_stage = req.body.assessment_stage
    sess.user_info.assessment_stage = assessment_stage
  } else {
    //throw user back to the start page
    console.log('\nSession does not exist. go back to the start page')
    return res.render('start', {error: 'We cannot find the details of your request. You will need to start again'})
  }

  var today = new Date();
  var earliestdate = new Date();
  earliestdate.setDate(today.getDate() + 28);

  var weekday = earliestdate.getDay();
  if (weekday === 0) {  //Sunday add 1
    earliestdate.setDate(earliestdate.getDate() + 1);
  }

  if (weekday === 6) {  //Saturday add 2
    earliestdate.setDate(earliestdate.getDate() + 2);
  }

  sess.user_info.earliestdate = earliestdate;
  var _month = earliestdate.getMonth();

  var months = [mlist[_month], mlist[_month + 1], mlist[_month + 2], mlist[_month + 3]]
  console.log('\n Session details' + util.inspect(sess))
  console.log('\n Months: ' + util.inspect(months))
  res.render('pick-date', {months: months})
})

router.post('/pick-day', function(req, res){
  sess = req.session
  var _month, _monthnum, _startdate;

  if (sess.user_info){
    var assessment_month = req.body.assessment_month
    _month = assessment_month
    _monthnum = sess.user_info.month_index
    _startdate = sess.user_info.earliestdate
    sess.user_info.assessment_month = assessment_month
  } else {
    //throw user back to the start page
    console.log('\nSession does not exist. go back to the start page')
    return res.render('start', {error: 'We cannot find the details of your request. You will need to start again'})
  }

  var dates = getDatesInMonth(mlist.indexOf(_month), _startdate) //get dates in Month
  console.log('\n dates in feb: ' + util.inspect(dates))

  console.log('\n Session details' + util.inspect(sess))
  res.render('pick-day', {month_picked: assessment_month, dates: dates})
})

router.post('/pick-time', function(req, res){
  sess = req.session

  if (sess.user_info){
    var assessment_date = req.body.assessment_date
    sess.user_info.assessment_date = assessment_date
  } else {
    //throw user back to the start page
    console.log('\nSession does not exist. go back to the start page')
    return res.render('start', {error: 'We cannot find the details of your request. You will need to start again'})
  }

  console.log('\n Session details' + util.inspect(sess))
  res.render('pick-time', {picked_date: sess.user_info.assessment_date})
})

router.post('/summary', function(req, res) {
  sess = req.session

  if (sess.user_info){
    var assessment_time = req.body.assessment_time
    sess.user_info.assessment_time = assessment_time
  } else {
    //throw user back to the start page
    console.log('\nSession does not exist. go back to the start page')
    return res.render('start', {error: 'We cannot find the details of your request. You will need to start again'})
  }

  console.log('\n Session details' + util.inspect(sess))
  res.render('summary', {user_info: sess.user_info})
})

router.post('/finish', function(req, res){
  sess = req.session

  if (sess.user_info){
    //TODO submit the form into a database and send email via Notify
    var _userinfo = sess.user_info

    //notify the user
    notifyClient.sendEmail("22098707-7d16-453a-8e02-baecc466c2d5", _userinfo.email, {
      'service': _userinfo.service_name,
      'service_manager': _userinfo.name,
      'assessment_date': _userinfo.assessment_date,
      'stage': _userinfo.assessment_stage,
      'assessment_time': "AM"
    })

    //notify the team
    notifyClient.sendEmail("22098707-7d16-453a-8e02-baecc466c2d5", team_email, {
      'service': _userinfo.service_name,
      'service_manager': _userinfo.name,
      'assessment_date': _userinfo.assessment_date,
      'stage': _userinfo.assessment_stage,
      'assessment_time': "AM"
    })

  } else {
    //throw user back to the start page
    console.log('\nSession does not exist. go back to the start page')
    return res.render('start', {error: 'We cannot find the details of your request. You will need to start again'})
  }

  res.render('summary', {user_info: sess.user_info, message: "Your details have been submitted!"})
})

module.exports = router
