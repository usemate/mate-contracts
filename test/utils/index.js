export const increaseNetworkTime = async seconds => {
  await network.provider.send('evm_increaseTime', [seconds])
  await network.provider.send('evm_mine') //
}

export const setNetworkTimestamp = async timestamp => {
  await network.provider.send('evm_setNextBlockTimestamp', [timestamp])
  await network.provider.send('evm_mine') //
}
