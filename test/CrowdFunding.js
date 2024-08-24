const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
"hardhat/console.sol:console"

describe("CrowdFunding", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearCrowdFundingFixture() {

    const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
    const crowdFunding = await CrowdFunding.deploy();

    return { crowdFunding };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { crowdFunding } = await loadFixture(deployOneYearCrowdFundingFixture);
      const [owner] = await ethers.getSigners();
      expect(await crowdFunding.owner()).to.equal(owner.address);
    });
  });

  describe("Campaign Creation", function () {
    it("Should create a new campaign", async function () {
      const { crowdFunding } = await loadFixture(deployOneYearCrowdFundingFixture);
      const [owner, benefactor] = await ethers.getSigners();
      const title = "Test Campaign";
      const description = "This is a test campaign";
      const goal = ethers.parseEther("1");
      const duration = 86400; // 1 day

      await expect(crowdFunding.createCampaign(title, description, benefactor.address, goal, duration))
        .to.emit(crowdFunding, "CampaignCreated")
        .withArgs(0, title, benefactor.address, goal, anyValue);

      const campaign = await crowdFunding.campaigns(0);
      expect(campaign.title).to.equal(title);
      expect(campaign.description).to.equal(description);
      expect(campaign.benefactor).to.equal(benefactor.address);
      expect(campaign.goal).to.equal(goal);
      expect(campaign.amountRaised).to.equal(0);
      expect(campaign.ended).to.be.false;
    });

    it("Should revert if goal is zero", async function () {
      const { crowdFunding } = await loadFixture(deployOneYearCrowdFundingFixture);
      const [owner, benefactor] = await ethers.getSigners();
      await expect(crowdFunding.createCampaign("Test", "Description", benefactor.address, 0, 86400))
        .to.be.revertedWith("Goal must be greater than zero");
    });
  });

  describe("Donations", function () {
    it("Should allow donations to a campaign", async function () {
      const { crowdFunding } = await loadFixture(deployOneYearCrowdFundingFixture);
      const [owner, benefactor, donor] = await ethers.getSigners();
      await crowdFunding.createCampaign("Test", "Description", benefactor.address, ethers.parseEther("1"), 86400);

      await expect(crowdFunding.connect(donor).donateToCampaign(0, { value: ethers.parseEther("0.5") }))
        .to.emit(crowdFunding, "DonationReceived")
        .withArgs(0, donor.address, ethers.parseEther("0.5"));

      const campaign = await crowdFunding.campaigns(0);
      expect(campaign.amountRaised).to.equal(ethers.parseEther("0.5"));
    });

    it("Should end campaign when goal is reached", async function () {
      const { crowdFunding } = await loadFixture(deployOneYearCrowdFundingFixture);
      const [owner, benefactor, donor] = await ethers.getSigners();
      await crowdFunding.createCampaign("Test", "Description", benefactor.address, ethers.parseEther("1"), 86400);

      await expect(crowdFunding.connect(donor).donateToCampaign(0, { value: ethers.parseEther("1") }))
        .to.emit(crowdFunding, "CampaignEnded")
        .withArgs(0, ethers.parseEther("1"), true);

      const campaign = await crowdFunding.campaigns(0);
      expect(campaign.ended).to.be.true;
    });
  });

  describe("Campaign Ending", function () {
    it("Should allow ending a campaign after deadline", async function () {
      const { crowdFunding } = await loadFixture(deployOneYearCrowdFundingFixture);
      const [owner, benefactor] = await ethers.getSigners();
      await crowdFunding.createCampaign("Test", "Description", benefactor.address, ethers.parseEther("1"), 1);

      await ethers.provider.send("evm_increaseTime", [2]); // Increase time by 2 seconds
      await ethers.provider.send("evm_mine"); // Mine a new block

      await expect(crowdFunding.endCampaign(0))
        .to.emit(crowdFunding, "CampaignEnded")
        .withArgs(0, 0, false);

      const campaign = await crowdFunding.campaigns(0);
      expect(campaign.ended).to.be.true;
    });
  });

  describe("Fund Withdrawal", function () {
    it("Should allow owner to withdraw leftover funds", async function () {
      const { crowdFunding } = await loadFixture(deployOneYearCrowdFundingFixture);
      const [owner] = await ethers.getSigners();

      // Send some Ether to the contract
      await owner.sendTransaction({
        to: crowdFunding.target,
        value: ethers.parseEther("1")
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await crowdFunding.withdrawLeftoverFunds();
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      const { crowdFunding } = await loadFixture(deployOneYearCrowdFundingFixture);
      const [owner, nonOwner] = await ethers.getSigners();

      await expect(crowdFunding.connect(nonOwner).withdrawLeftoverFunds())
        .to.be.revertedWith("Only the contract owner can call this function");
    });
  });

});