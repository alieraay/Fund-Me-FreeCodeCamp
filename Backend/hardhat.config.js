require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-ethers")
require("hardhat-gas-reporter")
require("solidity-coverage")

const GOERLI_URL = process.env.GOERLI_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COIN_MARKET_CAP_API_KEY = process.env.COIN_MARKET_CAP_API_KEY

module.exports = {
	solidity: {
		compilers: [
			{
				version: "0.8.8",
			},
			{
				version: "0.6.0",
			},
		],
	},
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 31337,
		},
		goerli: {
			url: GOERLI_URL,
			chainId: 5,
			accounts: [PRIVATE_KEY],
			blockConfirmations: 6,
		},
	},
	gasReporter: {
		enabled: true,
		outputFile: "gas-report.txt",
		noColors: true,
		currency: "USD",
		//coinmarketcap: COIN_MARKET_CAP_API_KEY,
		token: "MATIC",
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY,
	},

	namedAccounts: {
		deployer: {
			default: 0,
		},
	},
}
