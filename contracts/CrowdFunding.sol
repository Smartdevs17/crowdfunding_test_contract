// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract CrowdFunding {
    // Struct to represent a crowdfunding campaign
    struct Campaign {
        string title;
        string description;
        address payable benefactor;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        bool ended;
    }

    // Mapping to store campaigns by their ID
    mapping(uint256 => Campaign) public campaigns;
    // Counter to keep track of the total number of campaigns
    uint256 public campaignCount;
    // Address of the contract owner
    address public owner;

    // Events to log important actions
    event CampaignCreated(uint256 indexed campaignId, string title, address benefactor, uint256 goal, uint256 deadline);
    event DonationReceived(uint256 indexed campaignId, address donor, uint256 amount);
    event CampaignEnded(uint256 indexed campaignId, uint256 amountRaised, bool successful);

    // Modifier to restrict access to only the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }

    // Constructor to set the contract owner
    constructor() {
        owner = msg.sender;
    }

    // Function to create a new crowdfunding campaign
    function createCampaign(
        string memory _title,
        string memory _description,
        address payable _benefactor,
        uint256 _goal,
        uint256 _duration
    ) public {
        // Validate input parameters
        require(_goal > 0, "Goal must be greater than zero");
        require(_duration > 0, "Duration must be greater than zero");

        // Generate a new campaign ID and calculate the deadline
        uint256 campaignId = campaignCount++;
        uint256 deadline = block.timestamp + _duration;

        // Create and store the new campaign
        campaigns[campaignId] = Campaign({
            title: _title,
            description: _description,
            benefactor: _benefactor,
            goal: _goal,
            deadline: deadline,
            amountRaised: 0,
            ended: false
        });

        // Emit event for campaign creation
        emit CampaignCreated(campaignId, _title, _benefactor, _goal, deadline);
    }

    // Function to donate to a specific campaign
    function donateToCampaign(uint256 _campaignId) public payable {
        Campaign storage campaign = campaigns[_campaignId];
        // Check if the campaign is still active
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(msg.value > 0, "Donation amount must be greater than zero");
        require(!campaign.ended, "Campaign has already ended");

        // Update the amount raised
        campaign.amountRaised += msg.value;
        // Emit event for donation received
        emit DonationReceived(_campaignId, msg.sender, msg.value);

        // End the campaign if the goal is reached
        if (campaign.amountRaised >= campaign.goal) {
            endCampaign(_campaignId);
        }
    }

    // Function to end a campaign
    function endCampaign(uint256 _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        // Check if the campaign can be ended
        require(!campaign.ended, "Campaign has already ended");
        require(block.timestamp >= campaign.deadline || campaign.amountRaised >= campaign.goal, "Campaign cannot be ended yet");

        // Mark the campaign as ended
        campaign.ended = true;
        bool successful = campaign.amountRaised >= campaign.goal;

        // Transfer funds to the benefactor if any were raised
        if (campaign.amountRaised > 0) {
            campaign.benefactor.transfer(campaign.amountRaised);
        }

        // Emit event for campaign ended
        emit CampaignEnded(_campaignId, campaign.amountRaised, successful);
    }

    // Function for the owner to withdraw any leftover funds
    function withdrawLeftoverFunds() public onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds to withdraw");
        payable(owner).transfer(contractBalance);
    }

    // Fallback function to handle direct transfers to the contract
    receive() external payable {
        // Allow the owner to withdraw funds, otherwise revert
        if (msg.sender == owner && address(this).balance > 0) {
            payable(owner).transfer(address(this).balance);
        } else {
            revert("Use donateToCampaign function to make donations");
        }
    }
}