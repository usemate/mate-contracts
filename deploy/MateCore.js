const chalk = require('chalk')
const { ethers } = require('ethers')

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts
}) => {
  let { deployer } = await getNamedAccounts()

  let routerAddr = process.env.ROUTER_ADDRESS

  if (!routerAddr) throw new Error('Please provide router address')

  let mateToken = await deployments.get('MockToken')

  let mateMaker = await deployments.get('MateMaker')

  let core = await deployments.deploy('MateCore', {
    from: deployer,
    args: [routerAddr, mateToken.address, mateMaker.address]
  })

  if (core.newlyDeployed) {
    deployments.log(
      `Contract ${chalk.blue('MateCore')} deployed at ${chalk.green(
        core.address
      )} `
    )
  }
}

module.exports.tags = ['MateCore']
module.exports.dependencies = ['MateMaker']
