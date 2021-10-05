const chalk = require('chalk')
const { ethers } = require('ethers')

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts
}) => {
  let { deployer } = await getNamedAccounts()

  let mateToken = await deployments.get('MockToken')

  let stakingPool = await deployments.deploy('StakingPool', {
    from: deployer,
    args: [mateToken.address]
  })

  if (stakingPool.newlyDeployed) {
    deployments.log(
      `Contract ${chalk.blue('StakingPool')} deployed at ${chalk.green(
        stakingPool.address
      )} `
    )
  }
}

module.exports.tags = ['StakingPool']
module.exports.dependencies = ['MockToken']
