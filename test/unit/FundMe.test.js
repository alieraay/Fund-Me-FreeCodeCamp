const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts } = require("hardhat")

describe("FundMe Contract", async function () {
	let fundMe
	let deployer
	let mockV3Aggregator
	const sendValue = ethers.utils.parseEther("1")

	beforeEach(async function () {
		// getSigners() function returns accounts at hardhat.config.js
		// const accounts = await ethers.getSigners()
		// const accountZero = accounts[0]
		deployer = (await getNamedAccounts()).deployer
		await deployments.fixture(["all"])
		fundMe = await ethers.getContract("FundMe", deployer)
		mockV3Aggregator = await ethers.getContract(
			"MockV3Aggregator",
			deployer
		)
	})

	describe("constructor", async function () {
		it("sets the aggregator address correctly", async function () {
			const response = await fundMe.priceFeed()
			assert.equal(response, mockV3Aggregator.address)
		})
	})

	describe("Fails if you don't send enough ETH", async function () {
		it("require Value >= minUSD", async function () {
			await expect(fundMe.fund()).to.be.revertedWith(
				"You need to spend more ETH!"
			)
		})
		it("updated data structure", async function () {
			await fundMe.fund({
				value: sendValue,
			})
			const response = await fundMe.addressToAmountFunded(deployer)
			assert.equal(response.toString(), sendValue.toString())
		})
		it("check funders array", async function () {
			await fundMe.fund({
				value: sendValue,
			})
			const funder = await fundMe.funders(0)
			assert.equal(funder, deployer)
		})
	})
	describe("withdraw function", async function () {
		beforeEach(async function () {
			await fundMe.fund({
				value: sendValue,
			})
		})
		it("withdraw ETH from a single founder", async function () {
			const startingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const startingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)

			const transactionResponse = await fundMe.withdraw()
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt
			const gasCost = gasUsed * effectiveGasPrice

			const endingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const endingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)

			assert.equal(endingFundMeBalance, 0)
			assert.equal(
				endingDeployerBalance.add(gasCost).toString(),
				startingDeployerBalance.add(startingFundMeBalance).toString()
			)
		})
		it("withdraw with multiple funders", async function () {
			// Arange
			const accounts = await ethers.getSigners()
			for (i = 1; i < 6; i++) {
				const fundMeConnectedContract = await fundMe.connect(
					accounts[i]
				)
				await fundMeConnectedContract.fund({
					value: sendValue,
				})
			}
			const startingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const startingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)

			// Act
			const transactionResponse = await fundMe.withdraw()
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = await transactionReceipt
			const gasCost = gasUsed.mul(effectiveGasPrice)

			// Assert
			const endingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const endingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)

			assert.equal(endingFundMeBalance, 0)
			assert.equal(
				endingDeployerBalance.add(gasCost).toString(),
				startingDeployerBalance.add(startingFundMeBalance).toString()
			)

			// Make sure that funders are reset properly
			await expect(fundMe.funders(0)).to.be.reverted

			for (i = 1; i < 6; i++) {
				assert.equal(
					await fundMe.addressToAmountFunded(accounts[i].address),
					0
				)
			}
		})
		it("Only owner", async function () {
			const accounts = await ethers.getSigners()
			const attacker = accounts[1]
			const attackerConnectedContract = await fundMe.connect(attacker)
			await expect(
				attackerConnectedContract.withdraw()
			).to.be.revertedWithCustomError(
				attackerConnectedContract,
				"FundMe__NotOwner"
			)
		})
	})
})
