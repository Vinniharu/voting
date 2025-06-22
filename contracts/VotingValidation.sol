// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title VotingValidation
 * @dev Smart contract for blockchain-based vote validation and integrity verification
 * @author Voting System Team
 */
contract VotingValidation is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // Events
    event ElectionCreated(
        string indexed electionId,
        string electionHash,
        uint256 timestamp
    );
    
    event VoteSubmitted(
        string indexed electionId,
        bytes32 indexed voteHash,
        bytes32 voterHash,
        uint256 timestamp
    );
    
    event VoteValidated(
        string indexed electionId,
        bytes32 indexed voteHash,
        bool isValid,
        uint256 timestamp
    );

    // Structs
    struct Election {
        string electionId;
        string electionHash;
        uint256 createdAt;
        uint256 totalVotes;
        bool isActive;
        mapping(bytes32 => bool) voteHashes;
        mapping(bytes32 => bool) voterHashes;
        mapping(bytes32 => uint256) voteTimestamps;
    }

    struct VoteRecord {
        string electionId;
        bytes32 voteHash;
        bytes32 voterHash;
        uint256 timestamp;
        bool isValidated;
    }

    // State variables
    mapping(string => Election) public elections;
    mapping(bytes32 => VoteRecord) public voteRecords;
    mapping(string => bytes32[]) public electionVotes;
    
    string[] public electionIds;
    uint256 public totalElections;
    uint256 public totalVotes;

    // Modifiers
    modifier electionExists(string memory _electionId) {
        require(bytes(elections[_electionId].electionId).length > 0, "Election does not exist");
        _;
    }

    modifier electionActive(string memory _electionId) {
        require(elections[_electionId].isActive, "Election is not active");
        _;
    }

    modifier validVoteHash(bytes32 _voteHash) {
        require(_voteHash != bytes32(0), "Invalid vote hash");
        _;
    }

    modifier validVoterHash(bytes32 _voterHash) {
        require(_voterHash != bytes32(0), "Invalid voter hash");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new election
     * @param _electionId Unique identifier for the election
     * @param _electionHash Hash of election data for integrity verification
     */
    function createElection(
        string memory _electionId,
        string memory _electionHash
    ) external onlyOwner {
        require(bytes(_electionId).length > 0, "Election ID cannot be empty");
        require(bytes(_electionHash).length > 0, "Election hash cannot be empty");
        require(bytes(elections[_electionId].electionId).length == 0, "Election already exists");

        Election storage newElection = elections[_electionId];
        newElection.electionId = _electionId;
        newElection.electionHash = _electionHash;
        newElection.createdAt = block.timestamp;
        newElection.totalVotes = 0;
        newElection.isActive = true;

        electionIds.push(_electionId);
        totalElections++;

        emit ElectionCreated(_electionId, _electionHash, block.timestamp);
    }

    /**
     * @dev Submit a vote hash for validation
     * @param _electionId Election identifier
     * @param _voteHash Hash of the vote data
     * @param _voterHash Hash of the voter identifier
     */
    function submitVoteHash(
        string memory _electionId,
        bytes32 _voteHash,
        bytes32 _voterHash
    ) external 
        electionExists(_electionId)
        electionActive(_electionId)
        validVoteHash(_voteHash)
        validVoterHash(_voterHash)
        nonReentrant
    {
        Election storage election = elections[_electionId];
        
        // Check if voter has already voted
        require(!election.voterHashes[_voterHash], "Voter has already voted");
        
        // Check if vote hash already exists
        require(!election.voteHashes[_voteHash], "Vote hash already exists");

        // Store vote hash
        election.voteHashes[_voteHash] = true;
        election.voterHashes[_voterHash] = true;
        election.voteTimestamps[_voteHash] = block.timestamp;
        election.totalVotes++;

        // Create vote record
        voteRecords[_voteHash] = VoteRecord({
            electionId: _electionId,
            voteHash: _voteHash,
            voterHash: _voterHash,
            timestamp: block.timestamp,
            isValidated: true
        });

        // Add to election votes array
        electionVotes[_electionId].push(_voteHash);
        totalVotes++;

        emit VoteSubmitted(_electionId, _voteHash, _voterHash, block.timestamp);
        emit VoteValidated(_electionId, _voteHash, true, block.timestamp);
    }

    /**
     * @dev Validate a vote hash
     * @param _voteHash Hash of the vote to validate
     * @return isValid Whether the vote is valid
     * @return timestamp When the vote was submitted
     */
    function validateVote(bytes32 _voteHash) 
        external 
        view 
        validVoteHash(_voteHash)
        returns (bool isValid, uint256 timestamp) 
    {
        VoteRecord memory record = voteRecords[_voteHash];
        return (record.isValidated, record.timestamp);
    }

    /**
     * @dev Check if a voter has already voted in an election
     * @param _electionId Election identifier
     * @param _voterHash Hash of the voter identifier
     * @return hasVoted Whether the voter has already voted
     */
    function hasVoterVoted(
        string memory _electionId,
        bytes32 _voterHash
    ) external view 
        electionExists(_electionId)
        validVoterHash(_voterHash)
        returns (bool hasVoted) 
    {
        return elections[_electionId].voterHashes[_voterHash];
    }

    /**
     * @dev Get election vote count
     * @param _electionId Election identifier
     * @return voteCount Number of votes in the election
     */
    function getElectionVoteCount(string memory _electionId) 
        external 
        view 
        electionExists(_electionId)
        returns (uint256 voteCount) 
    {
        return elections[_electionId].totalVotes;
    }

    /**
     * @dev Get vote timestamp
     * @param _electionId Election identifier
     * @param _voteHash Hash of the vote
     * @return timestamp When the vote was submitted
     */
    function getVoteTimestamp(
        string memory _electionId,
        bytes32 _voteHash
    ) external view 
        electionExists(_electionId)
        validVoteHash(_voteHash)
        returns (uint256 timestamp) 
    {
        return elections[_electionId].voteTimestamps[_voteHash];
    }

    /**
     * @dev Get all vote hashes for an election
     * @param _electionId Election identifier
     * @return voteHashes Array of vote hashes
     */
    function getElectionVotes(string memory _electionId) 
        external 
        view 
        electionExists(_electionId)
        returns (bytes32[] memory voteHashes) 
    {
        return electionVotes[_electionId];
    }

    /**
     * @dev Get election details
     * @param _electionId Election identifier
     * @return electionHash Hash of election data
     * @return createdAt When the election was created
     * @return totalVotes Number of votes
     * @return isActive Whether the election is active
     */
    function getElectionDetails(string memory _electionId) 
        external 
        view 
        electionExists(_electionId)
        returns (
            string memory electionHash,
            uint256 createdAt,
            uint256 totalVotes,
            bool isActive
        ) 
    {
        Election storage election = elections[_electionId];
        return (
            election.electionHash,
            election.createdAt,
            election.totalVotes,
            election.isActive
        );
    }

    /**
     * @dev Deactivate an election
     * @param _electionId Election identifier
     */
    function deactivateElection(string memory _electionId) 
        external 
        onlyOwner 
        electionExists(_electionId) 
    {
        elections[_electionId].isActive = false;
    }

    /**
     * @dev Activate an election
     * @param _electionId Election identifier
     */
    function activateElection(string memory _electionId) 
        external 
        onlyOwner 
        electionExists(_electionId) 
    {
        elections[_electionId].isActive = true;
    }

    /**
     * @dev Get contract statistics
     * @return totalElections_ Total number of elections
     * @return totalVotes_ Total number of votes
     * @return contractBalance Contract balance
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 totalElections_,
            uint256 totalVotes_,
            uint256 contractBalance
        ) 
    {
        return (totalElections, totalVotes, address(this).balance);
    }

    /**
     * @dev Get all election IDs
     * @return electionIds_ Array of election IDs
     */
    function getAllElectionIds() 
        external 
        view 
        returns (string[] memory electionIds_) 
    {
        return electionIds;
    }

    /**
     * @dev Emergency function to withdraw contract balance
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}

    /**
     * @dev Fallback function
     */
    fallback() external payable {}
} 