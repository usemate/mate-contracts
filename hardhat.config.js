require('dotenv').config()
require('@babel/polyfill')
require('@babel/register')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('@nomiclabs/hardhat-ethers')
require('hardhat-tracer')
require('hardhat-log-remover')
require('hardhat-abi-exporter')
require('hardhat-deploy')

const chainIds = {
  testnet: 97,
  mainnet: 56
}

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      accounts: {
        mnemonic: process.env.MNEMONIC
      },
      saveDeployments: true
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: {
        mnemonic: process.env.MNEMONIC,
        accountsBalance: '100000000000000000000000'
      },
      saveDeployments: false
    }
    // testnet: {
    //   url: 'https://data-seed-prebsc-2-s3.binance.org:8545/',
    //   chainId: chainIds.testnet,
    //   // accounts: {
    //   //   mnemonic: process.env.MNEMONIC
    //   // },
    //   accounts: [process.env.PRIVATE_KEY],
    //   saveDeployments: true
    // }
    // mainnet: {
    //   url: 'https://bsc-dataseed.binance.org',
    //   chainId: chainIds.mainnet,
    //   accounts: [process.env.PRIVATE_KEY],
    //   saveDeployments: true
    // }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_APIKEY
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true
      }
    }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    deploy: './deploy',
    deployments: './deployments'
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  },
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true,
    only: [],
    spacing: 2
  }
}
