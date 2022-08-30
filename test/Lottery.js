// const { expect } = require("chai");

// describe('Lottery', function () {
//     let hardhatLotteryV1;
//     let hardhatProxy;

//   it('deploy logic', async function () {
//     let LotteryV1 = await ethers.getContractFactory("LotteryNft");
//     hardhatLotteryV1 = await LotteryV1.deploy();
//     await hardhatLotteryV1.deployed();
    
//     let Proxy = await ethers.getContractFactory('UnstructuredProxy');
//     hardhatProxy = await Proxy.deploy();
//     await hardhatProxy.deployed();

//     let addrImpl = await hardhatProxy.getImplementationAddress();
//     console.log("proxy.getImplementationAddress(): ", addrImpl);

//     hardhatProxy.setImplementationAddress(hardhatLotteryV1.address);
//     addrImpl = await hardhatProxy.getImplementationAddress();

//     console.log("after: proxy.setImplementationAddress(): ", addrImpl);
//     console.log("LotteryV1.address: ", hardhatLotteryV1.address);

//     expect(addrImpl).to.equal(hardhatLotteryV1.address);
//   });

//   it('Mint NFT ticket', async function () {
//     const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

//     let ticketCountBefore = await hardhatProxy.getTokensCounter();
//     console.log("ticketsCountBefore: ", ticketCountBefore);
//     hardhatLotteryV1.attach(hardhatProxy.address) as LotteryV1;
//     const tx = await hardhatProxy.connect(addr1).buyTicket("test", ethers.utils.parseEther("1.0"));
//     console.log("Buy ticket tx: ", tx);

//     let ticketCountAfter = await hardhatProxy.getTokensCounter();
//     console.log("ticketCountAfter: ", ticketCountAfter);
//   });
// });