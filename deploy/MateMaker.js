const chalk = require('chalk')
const { ethers } = require('ethers')

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts
}) => {
  let { deployer } = await getNamedAccounts()

  let factoryAddr = process.env.FACTORY_ADDRESS
  if (!factoryAddr) throw new Error('Please provide factory address')

  let wethAddr = process.env.WETH_ADDRESS
  if (!wethAddr) throw new Error('Please provide weth address')

  let mateToken = await deployments.get('MockToken')

  let stakingPool = await deployments.get('StakingPool')

  let mateMaker = await deployments.deploy('MateMaker', {
    from: deployer,
    args: [factoryAddr, mateToken.address, wethAddr, stakingPool.address]
  })

  if (mateMaker.newlyDeployed) {
    deployments.log(
      `Contract ${chalk.blue('MateMaker')} deployed at ${chalk.green(
        mateMaker.address
      )} `
    )
  }
}

module.exports.tags = ['MateMaker']
module.exports.dependencies = ['StakingPool']
