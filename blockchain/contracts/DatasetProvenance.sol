// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DatasetProvenance
 * @notice Stores tamper-evident provenance records for dataset versions.
 *
 * Design notes:
 * - Only compact metadata is stored on-chain.
 * - Actual dataset files stay off-chain.
 * - Each record is linked to the previous version's hash.
 */
contract DatasetProvenance {

    // ----------------------------------------------------------------
    // Data structures
    // ----------------------------------------------------------------

    struct ProvenanceRecord {
        string datasetId;      // unique ID of the dataset
        string versionId;      // unique ID of this version
        string operation;      // CREATED, CLEANED, FILTERED, TRANSFORMED...
        string fileHash;       // SHA-256 hash of this version's file
        string previousHash;   // SHA-256 hash of previous version (empty for V1)
        uint256 timestamp;     // blockchain time when recorded
        address recordedBy;    // wallet address that submitted the record
    }

    // datasetId => list of records (oldest first)
    mapping(string => ProvenanceRecord[]) private records;

    // Number of records stored against a dataset
    mapping(string => uint256) private recordCount;

    // ----------------------------------------------------------------
    // Events
    // ----------------------------------------------------------------

    event ProvenanceAdded(
        string indexed datasetId,
        string versionId,
        string operation,
        string fileHash,
        address indexed recordedBy,
        uint256 timestamp
    );

    // ----------------------------------------------------------------
    // Write functions
    // ----------------------------------------------------------------

    /**
     * @notice Add a provenance record for a dataset version.
     * @dev Called by the backend after a dataset/version is uploaded.
     */
    function addRecord(
        string calldata datasetId,
        string calldata versionId,
        string calldata operation,
        string calldata fileHash,
        string calldata previousHash
    ) external {
        require(bytes(datasetId).length > 0, "Dataset ID is required");
        require(bytes(versionId).length > 0, "Version ID is required");
        require(bytes(fileHash).length > 0, "File hash is required");

        records[datasetId].push(
            ProvenanceRecord({
                datasetId: datasetId,
                versionId: versionId,
                operation: operation,
                fileHash: fileHash,
                previousHash: previousHash,
                timestamp: block.timestamp,
                recordedBy: msg.sender
            })
        );

        recordCount[datasetId] += 1;

        emit ProvenanceAdded(
            datasetId,
            versionId,
            operation,
            fileHash,
            msg.sender,
            block.timestamp
        );
    }

    // ----------------------------------------------------------------
    // Read functions
    // ----------------------------------------------------------------

    /**
     * @notice Returns how many provenance records exist for a dataset.
     */
    function getRecordCount(string calldata datasetId)
        external
        view
        returns (uint256)
    {
        return recordCount[datasetId];
    }

    /**
     * @notice Returns a single record by index.
     */
    function getRecord(string calldata datasetId, uint256 index)
        external
        view
        returns (ProvenanceRecord memory)
    {
        require(index < records[datasetId].length, "Record index out of range");
        return records[datasetId][index];
    }

    /**
     * @notice Returns the most recent record for a dataset.
     */
    function getLatestRecord(string calldata datasetId)
        external
        view
        returns (ProvenanceRecord memory)
    {
        uint256 len = records[datasetId].length;
        require(len > 0, "No records for this dataset");
        return records[datasetId][len - 1];
    }
}