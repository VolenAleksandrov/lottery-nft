import { expect, assert } from 'chai';
import { ethers } from 'hardhat';
import { Factory, LotteryNft, LotteryNftV2, Proxy } from '../typechain-types';

describe('Lottery deployment and upgrading', () => {
    let hardhatLotteryV1: LotteryNft;
    let hardhatLotteryV2: LotteryNftV2;
    let hardhatProxy: Proxy;
    let hardhatFactory: Factory;
    let addressForNewProxyContract: string;

    it('deploy', async () => {
        let Factory = await ethers.getContractFactory("Factory");
        hardhatFactory = await Factory.deploy();
        await hardhatFactory.deployed();

        let LotteryV1 = await ethers.getContractFactory("LotteryNft");
        hardhatLotteryV1 = await LotteryV1.deploy();
        await hardhatLotteryV1.deployed();
    });

    it('Create proxy from factory', async () => {
        let newAddress;
        hardhatFactory.on("Deployed", (address, salt) => {
            newAddress = address;
        });
        let bytecode = await hardhatFactory.getBytecode();
        addressForNewProxyContract = await hardhatFactory.getAddress(bytecode, ethers.BigNumber.from(123));

        await hardhatFactory.deploy(ethers.BigNumber.from(123));
        await new Promise(res => setTimeout(res, 5000));
        expect(newAddress == addressForNewProxyContract);
    });

    it('Set proxy implementation', async () => {
        hardhatProxy = await ethers.getContractAt("Proxy", addressForNewProxyContract) as Proxy;
        await hardhatProxy.getImplementationAddress();
        expect(await hardhatProxy.getImplementationAddress()).to.equal("0x0000000000000000000000000000000000000000");

        await hardhatProxy.setImplementationAddress(hardhatLotteryV1.address);

        let attachedProxy = hardhatLotteryV1.attach(hardhatProxy.address) as LotteryNft;
        await attachedProxy.initialize(ethers.BigNumber.from(1), ethers.BigNumber.from(15));

        expect(await hardhatProxy.getImplementationAddress()).to.equal(hardhatLotteryV1.address);
    });

    it('Mint NFT tickets', async () => {
        const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
        let attachedProxy = hardhatLotteryV1.attach(hardhatProxy.address) as LotteryNft;

        expect(await attachedProxy.getTokensCounter()).to.equal(0);
        await attachedProxy.connect(addr1).buyTicket("test1", { value: ethers.utils.parseEther("1.0") });
        await attachedProxy.connect(addr2).buyTicket("test2", { value: ethers.utils.parseEther("1.0") });
        await attachedProxy.connect(addr3).buyTicket("test3", { value: ethers.utils.parseEther("1.0") });
        await attachedProxy.connect(addr4).buyTicket("test4", { value: ethers.utils.parseEther("1.0") });
        let balanceAfter = await attachedProxy.getBalance();
        let playersAddresses = await attachedProxy.getPlayers();
        expect(playersAddresses).to.contain(addr1.address);
        expect(playersAddresses).to.contain(addr2.address);
        expect(playersAddresses).to.contain(addr3.address);
        expect(playersAddresses).to.contain(addr4.address);
        expect(playersAddresses).to.not.contain(addr5.address);
        expect(balanceAfter).greaterThan(ethers.BigNumber.from(0));
        expect(await attachedProxy.getTokensCounter()).to.equal(4);
    });

    it('Pick winner before lottery end', async () => {
        const [owner] = await ethers.getSigners();
        let attachedProxy = hardhatLotteryV1.attach(hardhatProxy.address) as LotteryNft;
        try {
            await attachedProxy.connect(owner).pickWinner();
        } catch (error) {
            assert((error as Error).message.includes("Lottery is still open for new players!"), "Expectet to fail with 'Lottery is still open for new players!' but got another error!");
        }
    });

    it('Pick surprise winner on not upgraded contract', async () => {
        const [owner] = await ethers.getSigners();
        let attachedProxy = hardhatLotteryV1.attach(hardhatProxy.address) as LotteryNftV2;
        try {
            await attachedProxy.connect(owner).pickSurpriseWinner();
            throw null;
        }
        catch (error) {
            assert((error as Error).message.includes(".pickSurpriseWinner is not a function"), "Expectet to fail with '.pickSurpriseWinner is not a function' but got another error!");
        }
    });

    it('Change proxy implementation', async () => {
        let LotteryV2 = await ethers.getContractFactory("LotteryNftV2");
        hardhatLotteryV2 = await LotteryV2.deploy();
        await hardhatLotteryV2.deployed();

        await hardhatProxy.getImplementationAddress();
        expect(await hardhatProxy.getImplementationAddress()).to.equal(hardhatLotteryV1.address);

        await hardhatProxy.setImplementationAddress(hardhatLotteryV2.address);

        expect(await hardhatProxy.getImplementationAddress()).to.equal(hardhatLotteryV2.address);
    });

    it('Pick surprise winner', async () => {
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        let attachedProxy = hardhatLotteryV2.attach(hardhatProxy.address) as LotteryNftV2;

        let lotteryPlayersBalanceBeforePickWinner = (await addr1.getBalance()).add(await addr2.getBalance()).add(await addr3.getBalance()).add(await addr4.getBalance());
        let lotteryBalanceBeforePickSurpriseWinner = await attachedProxy.getBalance();
        await attachedProxy.connect(owner).pickSurpriseWinner();
        let lotteryBalanceAfterPickSurpriseWinner = await attachedProxy.getBalance();
        expect(lotteryBalanceBeforePickSurpriseWinner.div(2).eq(lotteryBalanceAfterPickSurpriseWinner)).to.be.true;
        let lotteryPlayersBalanceAfterPickWinner = (await addr1.getBalance()).add(await addr2.getBalance()).add(await addr3.getBalance()).add(await addr4.getBalance());

        expect(lotteryPlayersBalanceAfterPickWinner.gt(lotteryPlayersBalanceBeforePickWinner)).to.be.true;
    });

    it('Pick surprise winner second time', async () => {
        const [owner] = await ethers.getSigners();
        let attachedProxy = hardhatLotteryV2.attach(hardhatProxy.address) as LotteryNftV2;

        try {
            await attachedProxy.connect(owner).pickSurpriseWinner();
            throw null;
        }
        catch (error) {
            assert((error as Error).message.includes("Surprise winner is already picked!"), "Expectet to fail with 'Surprise winner is already picked!' but got another error!");
        }
    });

    it('Pick winner', async () => {
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        let attachedProxy = hardhatLotteryV1.attach(hardhatProxy.address) as LotteryNftV2;

        let lotteryPlayersBalanceBeforePickWinner = (await addr1.getBalance()).add(await addr2.getBalance()).add(await addr3.getBalance()).add(await addr4.getBalance());

        for (let index = 0; index < 10; index++) {
            await ethers.provider.send("evm_mine", []);
        }

        await attachedProxy.connect(owner).pickWinner();
        let lotteryPlayersBalanceAfterPickWinner = (await addr1.getBalance()).add(await addr2.getBalance()).add(await addr3.getBalance()).add(await addr4.getBalance());
        expect(lotteryPlayersBalanceAfterPickWinner.gt(lotteryPlayersBalanceBeforePickWinner)).to.be.true;

        try {
            await attachedProxy.connect(owner).pickWinner();
            throw null;
        }
        catch (error) {
            assert((error as Error).message.includes("Lottery ended!"), "Expectet to fail with 'Lottery ended!' but got another error!");
        }
    });
});
