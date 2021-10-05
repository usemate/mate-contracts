const { expect } = require('chai')
const { ethers, deployments } = require('hardhat')
import { utils, BigNumber } from 'ethers'
import { increaseNetworkTime, setNetworkTimestamp } from './utils'

import routerABI from '../abi/IUniswapV2Router02.json'

const AddressZero = ethers.constants.AddressZero

let owner,
  user,
  mateToken,
  wethToken,
  mateCore,
  weth,
  amountIn,
  orderId,
  pathToTokenOut,
  pathToMate,
  mateTokenAddr,
  wethAddr

let HOURS = 3600

let router

describe('Mate Core contracts', function () {
  before('Setup contracts and wallets', async () => {
    await deployments.fixture()
    ;[owner, user] = await ethers.getSigners()
    hre.tracer.nameTags[owner.address] = 'Owner'

    wethAddr = process.env.WETH_ADDRESS

    mateToken = await ethers.getContract('MockToken')

    wethToken = await ethers.getContractAt('IERC20', wethAddr, user)

    if (await mateToken.paused()) {
      await mateToken.unpause()
    }

    mateToken = mateToken.connect(user)
    mateTokenAddr = mateToken.address

    mateCore = await ethers.getContract('MateCore')

    let feeTo = await mateCore.feeTo()
    if (feeTo == ethers.constants.AddressZero) {
      await mateCore.setFeeTo(owner.address) // mock
    }
    router = await ethers.getContractAt(
      'IUniswapV2Router02',
      process.env.ROUTER_ADDRESS,
      user
    )

    let initialLiquidityMate = ethers.utils.parseEther('500000')
    let initialLiquidityEth = ethers.utils.parseEther('500')

    await mateToken.connect(owner).approve(router.address, initialLiquidityMate)

    await router
      .connect(owner)
      .addLiquidityETH(
        mateToken.address,
        initialLiquidityMate,
        initialLiquidityMate,
        initialLiquidityEth,
        owner.address,
        (await ethers.provider.getBlock()).timestamp + 120,
        { value: initialLiquidityEth }
      )
  })

  describe('MateCore.sol', async () => {
    it('should approve tokens', async () => {
      amountIn = ethers.utils.parseEther('0.001')
      let allowance = await wethToken.allowance(user.address, mateCore.address)

      if (allowance.lt(amountIn)) {
        let tx = await wethToken.approve(mateCore.address, amountIn.mul(100))
        await tx.wait(1)
      }
    })

    it('should place order', async () => {
      let currentTimestamp = (await ethers.provider.getBlock()).timestamp

      let tokenIn = process.env.WETH_ADDRESS
      let tokenOut = mateToken.address

      // Get some WETH to make balance available
      await user.sendTransaction({ to: tokenIn, value: amountIn })

      pathToTokenOut = [tokenIn, tokenOut]

      let amountOut = await mateCore.getAmountOutMin(amountIn, pathToTokenOut)

      let amounOutMin = amountOut.add(1)

      let recipient = user.address
      let expiration = Number(currentTimestamp) + 3 * HOURS

      let openOrdersLengthBefore = (await mateCore.getOpenOrders()).length

      if (openOrdersLengthBefore == 0) {
        let tx = await mateCore
          .connect(user)
          .placeOrder(
            tokenIn,
            tokenOut,
            amountIn,
            amounOutMin,
            recipient,
            expiration
          )

        await tx.wait(1)

        let openOrdersLengthAfter = (await mateCore.getOpenOrders()).length

        expect(openOrdersLengthAfter).to.eq(openOrdersLengthBefore + 1)
      }
    })

    it('should fail with insufficient output amount', async () => {
      let currentTimestamp = (await ethers.provider.getBlock()).timestamp
      let openOrders = await mateCore.getOpenOrders()
      orderId = openOrders[0]

      let order = await mateCore.getOrder(orderId)

      await user.sendTransaction({ to: wethAddr, value: amountIn })

      let balance = await wethToken.balanceOf(user.address)

      let pathToMate = [wethAddr, mateTokenAddr]

      let canExecuteOrder = await mateCore[
        'canExecuteOrder(bytes32,address[],address[])'
      ](orderId, pathToTokenOut, pathToMate)

      expect(canExecuteOrder.success).to.be.false

      let tx = mateCore['executeOrder(bytes32,address[],address[])'](
        orderId,
        pathToTokenOut,
        []
      )
      await expect(tx).to.be.revertedWith('Insufficient output amount')
    })

    it('should successfully execute order', async () => {
      let currentTimestamp = (await ethers.provider.getBlock()).timestamp
      let _amountIn = ethers.utils.parseEther('2000')

      await mateToken.connect(owner).transfer(user.address, _amountIn)
      let balanceBefore = await wethToken.balanceOf(user.address)

      await mateToken.approve(router.address, ethers.constants.MaxUint256)

      let buyTx = await router
        .connect(user)
        .swapExactTokensForTokens(
          _amountIn,
          1,
          [mateTokenAddr, wethAddr],
          user.address,
          currentTimestamp + 3 * HOURS
        )

      let balanceAfter = await wethToken.balanceOf(user.address)

      let openOrders = await mateCore.getOpenOrders()
      orderId = openOrders[0]

      let order = await mateCore.getOrder(orderId)

      // let amountOut = await mateCore.getAmountOutMin(amountIn, pathToTokenOut)

      pathToMate = pathToTokenOut // mock

      let canExecuteOrder = await mateCore[
        'canExecuteOrder(bytes32,address[],address[])'
      ](orderId, pathToTokenOut, pathToMate)

      let allowance = await wethToken.allowance(user.address, mateCore.address)

      if (allowance.lt(order.amountIn)) {
        await wethToken
          .connect(user)
          .approve(mateCore.address, ethers.constants.MaxUint256)
      }

      expect(canExecuteOrder.success).to.be.true

      let tx = await mateCore['executeOrder(bytes32,address[],address[])'](
        orderId,
        pathToTokenOut,
        pathToMate
      )
      expect(tx).to.emit(mateCore, 'OrderExecuted')
    })
  })
})
