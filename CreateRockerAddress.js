////////////////////////////////////////////////////////////////////
// Create security level 1 addresses for the IOTA rocker
//
// First: set your rocker's seed
////////////////////////////////////////////////////////////////////

const iotaLibrary = require('@iota/core')

const iota = iotaLibrary.composeAPI({
  provider: 'https://nodes.thetangle.org:443'
})

const seed = 'YOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREYOURSEEDGOESHEREY'

console.log('Creating Rocker\'s Security Level 1 addresses...\n')

// Creating Listening addess
iota
    .getNewAddress(seed, { index: 0, total: 1, security: 1, checksum: true})
    .then(address => {
        console.log('Rocker\'s Listening address: ' + address[0])
    })
    .catch(err => {
        console.log(err)
    })

    // Creating funding address, which is he first unused address of the seed. 
iota
    .getNewAddress(seed, { security: 1, checksum: true, returnAll:true})
    .then(address => {
        console.log('Rocker\'s Funding address  : ' + address[address.length-1])
    })
    .catch(err => {
        console.log(err)
    })
