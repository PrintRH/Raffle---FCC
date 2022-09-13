// Staging test to run on testnet

const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip // Syntax here means if we are on a development chain, do below, if not then test on local network.
    : describe("Raffle Unit Tests", function () {
          let raffle, raffleEntranceFee, deployer //global storage

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  // IN this it function, we are supposed to just enter the raffle. Let Chainlink do the rest
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up listener...")
                  await new Promise(async (resolve, reject) => {
                      //Setup listener before we enter the raffle
                      // Just in case the blockchain moves REALLY fast
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // Adding asserts here
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                          } catch (error) {
                              console.log(error)
                              reject(e)
                          }
                          resolve()
                      })
                  })
                  // Set up listener then enter raffle is really all that is going on here

                  console.log("Entering Raffle...")
                  const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                  await tx.wait(1)
                  console.log("Ok, time to wait...")
                  const winnerStartingBalance = await accounts[0].getBalance()

                  // AND This code WON'T complete until our listener has finished listening!
              })
          })
      })
