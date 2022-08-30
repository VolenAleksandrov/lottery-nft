// const { expect } = require("chai");
import { ContractAddressOrInstance } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { LotteryNft, LotteryNftV2, UnstructuredProxy } from '../typechain-types';

describe('Lottery deployment and upgrading', () => {
    let hardhatLotteryV1: LotteryNft;
    let hardhatProxy: UnstructuredProxy;

    it('deploy logic', async () => {
        let LotteryV1 = await ethers.getContractFactory("LotteryNft");
        hardhatLotteryV1 = await LotteryV1.deploy();
        await hardhatLotteryV1.deployed();
        let Proxy = await ethers.getContractFactory('UnstructuredProxy');
        hardhatProxy = await Proxy.deploy();
        await hardhatProxy.deployed();

        await hardhatProxy.getImplementationAddress();
        expect(await hardhatProxy.getImplementationAddress()).to.equal("0x0000000000000000000000000000000000000000");

        await hardhatProxy.setImplementationAddress(hardhatLotteryV1.address);

        let attachedProxy = hardhatLotteryV1.attach(hardhatProxy.address) as LotteryNft;
        await attachedProxy.initialize(ethers.BigNumber.from(1), ethers.BigNumber.from(1000000));

        expect(await hardhatProxy.getImplementationAddress()).to.equal(hardhatLotteryV1.address);
    });

    it('Mint NFT ticket', async () => {
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        let attachedProxy = hardhatLotteryV1.attach(hardhatProxy.address) as LotteryNft;

        expect(await attachedProxy.getTokensCounter()).to.equal(0);

        await attachedProxy.connect(addr1).buyTicket("test", { value: ethers.utils.parseEther("1.0") });

        expect(await attachedProxy.getTokensCounter()).to.equal(1);
    });

    it('deploy new logic', async () => {
        const LotteryV2 = await ethers.getContractFactory("LotteryNftV2");
        let hardhatLotteryV2 = await LotteryV2.deploy();
        hardhatLotteryV2.deployed();

        await hardhatProxy.setImplementationAddress(hardhatLotteryV2.address);
        expect(await hardhatProxy.getImplementationAddress()).to.equal(hardhatLotteryV2.address);

        let attachedProxyV2 = hardhatLotteryV2.attach(hardhatProxy.address) as LotteryNftV2;
        expect(await attachedProxyV2.getTokensCounter()).to.equal(1);
    });
});
