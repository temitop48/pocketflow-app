// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PocketFlowRegistry {
    enum VisibilityMode {
        Private,
        Public,
        Shared
    }

    struct Profile {
        VisibilityMode visibility;
        bytes32 profileHash;
        string sharedProfileId;
        uint256 updatedAt;
    }

    mapping(address => Profile) private profiles;

    event VisibilityUpdated(address indexed user, VisibilityMode visibility);
    event ProfileHashUpdated(address indexed user, bytes32 profileHash);
    event SharedProfileIdUpdated(address indexed user, string sharedProfileId);

    function setVisibility(VisibilityMode visibility) external {
        profiles[msg.sender].visibility = visibility;
        profiles[msg.sender].updatedAt = block.timestamp;

        emit VisibilityUpdated(msg.sender, visibility);
    }

    function setProfileHash(bytes32 profileHash) external {
        profiles[msg.sender].profileHash = profileHash;
        profiles[msg.sender].updatedAt = block.timestamp;

        emit ProfileHashUpdated(msg.sender, profileHash);
    }

    function setSharedProfileId(string calldata sharedProfileId) external {
        profiles[msg.sender].sharedProfileId = sharedProfileId;
        profiles[msg.sender].updatedAt = block.timestamp;

        emit SharedProfileIdUpdated(msg.sender, sharedProfileId);
    }

    function getMyProfile() external view returns (Profile memory) {
        return profiles[msg.sender];
    }

    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }
}