pragma solidity ^0.5.0;
//pragma experimental ABIEncoderV2;

import './interfaces/IBasisAsset.sol';
import './interfaces/IERC20.sol';
import './owner/Ownable.sol';
import './lib/Safe112.sol';
import './lib/SafeERC20.sol';
import './guards/ReentrancyGuard.sol';


contract Boardroom is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;
    using Safe112 for uint112;

    /* ========== DATA STRUCTURES ========== */

    struct Boardseat {
        uint256 appointmentTime;
        uint256 shares;
    }

    struct BoardSnapshot {
        uint256 timestamp; 
        uint256 rewardReceived;
        uint256 totalShares;
    }
    
    /* ========== STATE VARIABLES ========== */

    IERC20 private share; 
    IERC20 private cash;

    mapping (address => Boardseat) private directors;
    BoardSnapshot[] private boardHistory; 

    /* ========== CONSTRUCTOR ========== */

    constructor(IERC20 _cash, IERC20 _share) public {
        cash = _cash;
        share = _share;

        BoardSnapshot memory genesisSnapshot = BoardSnapshot(now, 0, 0); 
        boardHistory.push(genesisSnapshot);
    }

    /* ========== VIEW FUNCTIONS ========== */

    

    /* ========== MODIFIERS ========== */

    modifier directorExists {
        require(directors[msg.sender].shares > 0, "directorExists: The director does not exist");
        _;
    }


    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");

        // Claim all outstanding dividends before making state changes 
        claimDividends();

        // Reset current snapshot
        boardHistory[boardHistory.length - 1].totalShares = boardHistory[boardHistory.length - 1].totalShares.add(amount);

        Boardseat memory director = directors[msg.sender];
        if (director.shares == 0) {
            director.appointmentTime = now; 
            director.shares = amount; 
        } else {
            director.shares = director.shares.add(amount); 
        }
        directors[msg.sender] = director; 

        share.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant {
        require(amount > 0, "Cannot withdraw 0");

        Boardseat memory director = directors[msg.sender]; 
        require(director.shares > amount, "Boardroom: withdraw request greater than staked amount");

        // Claim all outstanding dividends before making state changes 
        claimDividends();

        // Reset current snapshot
        boardHistory[boardHistory.length - 1].totalShares = boardHistory[boardHistory.length - 1].totalShares.sub(amount);

        director.shares = director.shares.sub(amount);
        directors[msg.sender] = director; 
        share.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);    
    }

    function exit() external {
        withdraw(directors[msg.sender].shares);
    }

    function claimDividends() public directorExists { 
        uint256 totalRewards = 0;
        for (uint256 i = boardHistory.length - 1; i >=0; i--) {
            BoardSnapshot memory snapshot = boardHistory[i];

            if (snapshot.timestamp < directors[msg.sender].appointmentTime) {
                break; 
            }
            
            uint256 snapshotRewards = snapshot.rewardReceived.mul(directors[msg.sender].shares).div(snapshot.totalShares);
            totalRewards = totalRewards.add(snapshotRewards);
        }

        if (totalRewards > 0) {
            cash.safeTransfer(msg.sender, totalRewards);
            emit RewardPaid(msg.sender, totalRewards);
        }

        // reset appointment time
        directors[msg.sender].appointmentTime = now;
    }


    function allocateSeigniorage(uint256 amount) external {
        require(amount > 0, "Cannot allocate 0");

        // Create & add new snapshot
        BoardSnapshot memory newSnapshot = BoardSnapshot(now, amount, boardHistory[boardHistory.length - 1].totalShares);
        boardHistory.push(newSnapshot);

        cash.safeTransferFrom(msg.sender, address(this), amount);

        emit RewardAdded(amount);
    }

    /* ========== EVENTS ========== */

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);
}