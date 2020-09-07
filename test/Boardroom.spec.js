const Share = artifacts.require('Share')
const Boardroom = artifacts.require('Boardroom')
const doesNotWork = require('./utils')

contract('Boardroom', function (accounts) {
  it('stake works', async () => {
    // Get a reference to the deployed Basis Share and Boardroom contract, as a JS object.
    const boardroomInstance = await Boardroom.deployed()
    const shareInstance = await Share.deployed()
    const boardroom = boardroomInstance
    const share = shareInstance
    // Set numbers
    let fifty_thousand = web3.utils
      .toBN(5 * 10 ** 4)
      .mul(web3.utils.toBN(10 ** 18))
    let five_thousand = web3.utils
      .toBN(5 * 1 ** 4)
      .mul(web3.utils.toBN(10 ** 18))

    // Mint shares to test
    await share.mint(accounts[0], fifty_thousand.toString())
    // Allow Boardroom to use user's share
    await share.approve(boardroom.address, five_thousand.toString())
    // Stake shares to the boardroom
    await boardroom.stake(five_thousand.toString())
    // Check stake
    const getShares = await boardroom.getBoardSeatBalance({
      from: accounts[0],
    })
    const staked = getShares.valueOf().toString()
    assert.equal(staked, five_thousand.toString())
  })
  it('stake with zero amount does not work', async () => {
    // Get a reference to the deployed Basis Share and Boardroom contract, as a JS object.
    const boardroomInstance = await Boardroom.deployed()
    const boardroom = boardroomInstance
    let zero = web3.utils.toBN(0)
    try {
      await boardroom.stake(zero.toString())
    } catch (error) {
      const vmException = error.message.search('Cannot stake 0.') >= 0
      assert(vmException, "Expected throw, got '" + error + "' instead")
      return
    }
    assert.fail('Expected throw not received')
  })
  it('withdraw works', async () => {
    // Get a reference to the deployed Basis Share and Boardroom contract, as a JS object.
    const boardroomInstance = await Boardroom.deployed()
    const boardroom = boardroomInstance
    // Set numbers
    let three_thousand = web3.utils
      .toBN(3 * 1 ** 4)
      .mul(web3.utils.toBN(10 ** 18))
    let two_thousand = web3.utils
      .toBN(2 * 1 ** 4)
      .mul(web3.utils.toBN(10 ** 18))

    // Withdraw shares from the boardroom
    await boardroom.withdraw(three_thousand.toString())
    // Check left deposit
    const getShares = await boardroom.getBoardSeatBalance({ from: accounts[0] })
    const staked = getShares.valueOf().toString()
    assert.equal(staked, two_thousand.toString())
  })
  it('withdraw with zero amount does not work', async () => {
    // Get a reference to the deployed Basis Share and Boardroom contract, as a JS object.
    const boardroomInstance = await Boardroom.deployed()
    const boardroom = boardroomInstance
    let zero = web3.utils.toBN(0)
    doesNotWork(boardroom.withdraw(zero.toString()), 'Cannot withdraw 0.')
  })
  it('withdraw over the staked amount does not work', async () => {
    // Get a reference to the deployed Basis Share and Boardroom contract, as a JS object.
    const boardroomInstance = await Boardroom.deployed()
    const boardroom = boardroomInstance
    let fifty_thousand = web3.utils
      .toBN(5 * 10 ** 4)
      .mul(web3.utils.toBN(10 ** 18))
    doesNotWork(
      boardroom.withdraw(fifty_thousand.toString()),
      'withdraw request greater than staked amount',
    )
  })
  it('allocate seigniorage to 0 amount does not work', async () => {
    // Get a reference to the deployed Basis Share and Boardroom contract, as a JS object.
    const boardroomInstance = await Boardroom.deployed()
    const boardroom = boardroomInstance
    let zero = web3.utils.toBN(0)
    doesNotWork(
      boardroom.allocateSeigniorage(zero.toString()),
      'Cannot allocate 0',
    )
  })
})
