const chalk = require('chalk')
module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts
}) => {
  const { deployer } = await getNamedAccounts()

  let mateToken = await deployments.deploy('MockToken', {
    from: deployer,
    args: []
  })

  if (mateToken.newlyDeployed) {
    deployments.log(
      `Contract ${chalk.blue('MockToken')} deployed at ${chalk.green(
        mateToken.address
      )} `
    )
  }
}

module.exports.tags = ['MockToken']
