////////////////////////////////////////////////////////////////////
// Create security level 1 addresses for the IOTA rocker
//
// First: set your rocker's seed
////////////////////////////////////////////////////////////////////

const iotaLibrary = require('@iota/core')

const iota = iotaLibrary.composeAPI({
  provider: 'https://nodes.thetangle.org:443'
})

const seed =
  'YOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREY'
console.log('Creating Rocker\'s Security Level 1 addresses...\n')

randomindex = Math.floor(Math.random() * 100000) + 1
iota
  .getNewAddress(seed, { index: 0, total: 1, security: 1, checksum: true})
  .then(address => {

    console.log('Rocker\'s Listening address: ' + address[0])
  })
  .catch(err => {
    console.log(err)
  })

  iota
  .getNewAddress(seed, { index: randomindex, total: 1, security: 1, checksum: true})
  .then(address => {

    console.log('Rocker\'s Funding address  : ' + address[0])
    console.log('!!! WARNING !!! \nIF THE FUNDING ADDRESS HAS BEEN USED BEFORE, RUN THIS TOOL AGAIN TO GENERATE A NEW ADDRESS')
  })
  .catch(err => {
    console.log(err)
  })
