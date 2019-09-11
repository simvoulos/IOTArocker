/////////////////////////////////////////////////////
//
//            IOTA Powered Baby Rocker
//
//
//          FIRST SET THE SETUP VARIABLES
/////////////////////////////////////////////////////

const iotaLibrary = require('@iota/core')
const Converter = require('@iota/converter')
var i2c = require('i2c-bus')
var MPU6050 = require('i2c-mpu6050')
var oled = require('oled-i2c-bus')
var font = require('oled-font-5x7')

//SETUP
const seed       = 'YOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREY'
const msgAddress = 'LISTENINGADDRESSGOESHERELISTENINGADDRESSGOESHERELISTENINGADDRESSGOESHERELISTENINGADDRESSGO'
var IOTAperMove  = 1

//Sensor Variables
var i2caddress = 0x68
var i2c1 = i2c.openSync(1)
var sensor = new MPU6050(i2c1, i2caddress)
var moves = 0
var has_been_back = false
var max_timeout = 100
var timeout = 0

//OLED Variables
var opts = {
  width: 128,
  height: 64,
  address: 0x3C
}

var oled = new oled(i2c1, opts)

//IOTA Variables
const iota = iotaLibrary.composeAPI({
  provider: 'https://nodes.thetangle.org:443'
})
var IOTAsendAddress = ""
var IncomingMessages = -1


function resetVars(){
  IOTAsendAddress = ""
  IncomingMessages = -1
  moves = 0
  has_been_back = false
  max_timeout = 180
  timeout= 0
}

// The function that listens for new messages
function initCheckMsgPromise()
{
  checkMsg = new Promise((resolve, reject) => {
    var returnedAddress=""
    iota
      .findTransactionObjects({ addresses: [msgAddress] })
      .then(response => {
          const msg = response
          	.sort((a, b) => b.timestamp - a.timestamp)
           	.map((tx) => tx.signatureMessageFragment)
          if (msg.length > 0){
            // Remove 9s from the end of the message
           	payload = msg[0].replace(/(99)+$/, '')
            if(payload.length % 2 != 0) {
            // Remove last character from string
             	payload = payload.slice(0, -1)
           	}
           	if(payload.length>0){
           		//Convert trytes to plan text
           		data = Converter.trytesToAscii(payload)
           		if (IncomingMessages == -1) {
               	//Initialize IncomingMessages
             		IncomingMessages = msg.length
           		}
             	else {
              	if (IncomingMessages<msg.length) {
                  IncomingMessages=msg.length
                  IOTAsendAddress = data
              	}
          		} 
            }
            if (IOTAsendAddress =="") {
              console.log("No message yet...")
              return new Promise((res) => {
                setTimeout(() => {
                  startPromises()
                }, 5000)
              })
            }
           	else {
              console.log("Message = ", IOTAsendAddress)
              updateOledMoves()
              resolve(IOTAsendAddress)
            }
          }
          else {
          	console.log('No transactions found.')
            IncomingMessages = 0
          	return new Promise((res) => {
            		setTimeout(() => {
            		startPromises()
            		}, 5000)
          	})
          }
      })
      .catch(err => {
        console.error(err)
      })
  })
}

// The function that checks for moves by checking the MPU6050 sensor.
function readMoves(){
  var accel = sensor.readAccelSync()
  var rotation = sensor.readRotationSync(accel)
  console.log('Counting moves...')
  if ((has_been_back==false)&&(rotation.x < -2))  {
    has_been_back = true
    timeout = 0
  }
  else if ((has_been_back==true)&&(rotation.x > 2))  {
    moves++
    has_been_back = false
    timeout = 0
    updateOledMoves()
  }
  else  {
    // If no moves are detected increase timeout variable
    timeout++
  }
  console.log("Moves: "+moves +" X: "+rotation.x)
  //Check for inactivity
  if (timeout >= max_timeout)  {
    return Promise.resolve(0)
  } 
  else  {
    return new Promise((resolve) => {
      setTimeout(() => {resolve(readMoves());},250)
    })
  }
}

// The async function that sends the IOTA tokens to the users address
// The amount of tokens that will be sent is calculated by the formula IOTAtoSend = moves * IOTAperMove
const sendTokens = async () => {
  // Construct a TX to our new address
  if (moves>0){
  	var IOTAtoSend= moves*IOTAperMove
  	var transfers = [
    	{
      	value: IOTAtoSend,
      	address: IOTAsendAddress,
      	tag: 'IOTAROCKER'
     	}]
  	console.log('Sending '+IOTAtoSend+'i to ' + IOTAsendAddress)
  	oled.clearDisplay()
  	oled.setCursor(5,1)
  	oled.writeString(font, 2, ' Sending ', 1, true)
  	oled.setCursor(15,30)
	  oled.writeString(font,2,''+IOTAtoSend+'i',1,true)
	  oled.update()
  	try {
    	// Construct bundle and convert to trytes
    	const trytes = await iota.prepareTransfers(seed, transfers,  {  security: 1  })
    	console.log('Transfer prepared...')
    	// Send bundle to node.
    	const response = await iota.sendTrytes(trytes, 3, 14)
    	console.log('Completed TXs')
    	response.map(tx => console.log(tx))
    } 
    catch (e) {
    	oled.clearDisplay()
    	oled.setCursor(1,1)
    	oled.writeString(font, 2, 'Error!!!', 1, true)
    	oled.update()
    	console.log(e)
  	}
  }
  else {
	  console.log('No moves detected, nothing to send...')
  }
}

// Helper function to display the moves at the OLED module
function updateOledMoves()
{
  oled.clearDisplay()
  oled.setCursor(37, 1)
  oled.writeString(font, 2, 'Moves', 1, true)
  oled.setCursor(47, 30)
  oled.writeString(font, 3, ""+moves, 1, true)
  oled.update()
}

// The function that handles all the promises
function startPromises(){
  initCheckMsgPromise()
  oled.clearDisplay()
  oled.setCursor(10,1)
  oled.writeString(font, 2, 'Message me', 1, true)
  oled.setCursor(15,20)
  oled.writeString(font, 2, 'your IOTA', 1, true)
  oled.setCursor(25,40)
  oled.writeString(font, 2, 'address', 1, true)
  oled.update()
  checkMsg.then(readMoves).then(sendTokens).then(resetVars).then(startPromises)
}

startPromises()
console.log('IOTA Baby Rocker...')