const Bond = artifacts.require('Bond')
const Cash = artifacts.require('Cash')
const Treasury = artifacts.require('Treasury')
const MockOracle = artifacts.require('MockOracle')
const MockDai = artifacts.require('MockDai')
const Oracle = artifacts.require('Oracle')
const helper = require('./utils')

contract('Treasury', function (accounts) {
  it('buying bond with insufficient balance does not work', async () => {
    // Get a reference to the deployed Treasury, Cash, and Bond contract, as a JS object.
    const treasuryInstance = await Treasury.deployed()
    const treasury = treasuryInstance
    const cashInstance = await Cash.deployed()
    const cash = cashInstance
    const bondInstance = await Bond.deployed()
    const bond = bondInstance
    let three_thousand = web3.utils
      .toBN(3 * 10 ** 3)
      .mul(web3.utils.toBN(10 ** 18))
    let fifty_thousand = web3.utils
      .toBN(5 * 10 ** 4)
      .mul(web3.utils.toBN(10 ** 18))
    await cash.transferOperator(treasury.address, { from: accounts[0] })
    await bond.transferOperator(treasury.address, { from: accounts[0] })
    await cash.approve(treasury.address, three_thousand, { from: accounts[0] })

    await helper.doesNotWork(
      treasury.buyBonds(fifty_thousand),
      'burn amount exceeds allowance',
    )
  })
  it('buying bond from non-operator does not work', async () => {
    // Get a reference to the deployed Treasury and Cash contract, as a JS object.
    const treasuryInstance = await Treasury.deployed()
    const treasury = treasuryInstance
    const cashInstance = await Cash.deployed()
    const cash = cashInstance
    let one_thousand = web3.utils
      .toBN(1 * 10 ** 3)
      .mul(web3.utils.toBN(10 ** 18))
    await cash.transferOperator(cash.address, { from: accounts[0] })

    await helper.doesNotWork(
      treasury.buyBonds(one_thousand, { from: accounts[0] }),
      'operator',
    )
  })
  it('redeeming bond with insufficient allowance does not work', async () => {
    // Get a reference to the deployed Treasury, Cash, and Bond contract, as a JS object.
    const treasuryInstance = await Treasury.deployed()
    const treasury = treasuryInstance
    const cashInstance = await Cash.deployed()
    const cash = cashInstance
    const bondInstance = await Bond.deployed()
    const bond = bondInstance
    let three_thousand = web3.utils
      .toBN(3 * 10 ** 3)
      .mul(web3.utils.toBN(10 ** 18))
    let fifty_thousand = web3.utils
      .toBN(5 * 10 ** 4)
      .mul(web3.utils.toBN(10 ** 18))
    await cash.transferOperator(treasury.address, { from: accounts[0] })
    await bond.transferOperator(treasury.address, { from: accounts[0] })
    await bond.approve(treasury.address, three_thousand, { from: accounts[0] })

    await helper.doesNotWork(
      treasury.redeemBonds(fifty_thousand),
      'burn amount exceeds allowance',
    )
  })
  it('redeeming bond from non-operator does not work', async () => {
    // Get a reference to the deployed Treasury and Bond contract, as a JS object.
    const treasuryInstance = await Treasury.deployed()
    const treasury = treasuryInstance
    const bondInstance = await Bond.deployed()
    const bond = bondInstance
    let one_thousand = web3.utils
      .toBN(1 * 10 ** 3)
      .mul(web3.utils.toBN(10 ** 18))
    await bond.transferOperator(bond.address, { from: accounts[0] })

    await helper.doesNotWork(
      treasury.redeemBonds(one_thousand, { from: accounts[0] }),
      'operator',
    )
  })
  it('allocating seigniorage works when passed a day', async () => {
    // Get a reference to the deployed Trasury and Bond contract, as a JS object.
    const treasuryInstance = await Treasury.deployed()
    const treasury = treasuryInstance
    const one_day = 24 * 3600
    helper.advanceTime(one_day)
    await helper.doesNotWork(
      treasury.allocateSeigniorage(),
      'no seigniorage to be allocated',
    )
  })
  // TODO: Replicate Uniswap V2 and test inflation
  it('allocating seigniorage works when cashPrice hits the ceiling', async () => {
    // Get a reference to the deployed Trasury and Bond contract, as a JS object.
    const treasuryInstance = await Treasury.deployed()
    const treasury = treasuryInstance
    const one_day = 24 * 3600
    helper.advanceTime(one_day)
    await treasury.allocateSeigniorage()
  })
})
