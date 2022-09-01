pragma solidity ^0.8.0;

contract Anchoring {
    uint constant statusOK = 200;
    uint constant statusAddedConstSSIOK = 201;
    uint constant statusHashLinkOutOfSync = 100;
    uint constant statusCannotUpdateReadOnlyAnchor = 101;
    uint constant statusHashOfPublicKeyDoesntMatchControlString = 102;
    uint constant statusSignatureCheckFailed = 103;
    uint constant statusTimestampOrSignatureCheckFailed = 104;
    uint constant statusCannotCreateExistingAnchor = 105;
    uint constant statusCannotAppendToNonExistentAnchor = 106;
    uint constant statusCannotAppendConstAnchor = 107;

    event InvokeStatus(uint indexed statusCode);

    event Result(bytes str);
    event StringResult(string str);
    event UIntResult(uint str);
    event Bytes32Result(bytes32 str);
    event Bytes1Result(bytes1 str);
    event BoolResult(bool str);
    event StringArrayResult(string[] str);
    event StringArray2Result(string[2] str);

    struct DynamicArray {
        bytes[] array;
    }

    function dynamicArrayPush(DynamicArray memory arr, bytes memory value) private {
        bytes[] memory copy;
        copy = new bytes[](arr.array.length + 1);
        for (uint i = 0; i < arr.array.length; i++) {
            copy[i] = arr.array[i];
        }

        copy[arr.array.length] = value;
        arr.array = copy;
    }


    bytes constant ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    uint constant BASE = 64;
    mapping(bytes1 => uint8) BASE_MAP;
    constructor() public {
        for (uint8 i = 0; i < ALPHABET.length; i++) {
            BASE_MAP[ALPHABET[i]] = i;
        }
    }

    struct Anchor {
        string anchorId;
        string[] anchorValues;
    }

    mapping(string => string[]) anchorValues;
    mapping(uint => string) indexOfAnchor;
    string[] indexedAnchors;

    function createAnchor(string memory anchorId, string memory newAnchorValue) public {
        bytes[] memory anchorIdComponents = parseSSI(anchorId);
        if (anchorValues[anchorId].length > 0) {
            emit InvokeStatus(statusCannotCreateExistingAnchor);
            return;
        }

        if (!validateAnchorValue(anchorIdComponents, anchorId, newAnchorValue)) {
            emit InvokeStatus(statusSignatureCheckFailed);
            return;
        }
        anchorValues[anchorId].push(newAnchorValue);
        indexOfAnchor[indexedAnchors.length] = anchorId;
        indexedAnchors.push(anchorId);
        emit InvokeStatus(statusOK);
    }

    function validateAnchorValue(bytes[] memory anchorIdComponents, string memory anchorId, string memory newAnchorValue) private returns (bool) {
        if (isConstSSI(anchorIdComponents)) {
            return true;
        }

        bytes memory publicKey = getPublicKey(anchorIdComponents, anchorId);

        bytes[] memory newAnchorValueComponents = parseSSI(newAnchorValue);
        bytes memory signature = getSignatureFromAnchorValue(newAnchorValueComponents);
        string memory brickMapHash = string(newAnchorValueComponents[3]);
        string memory timestamp = getTimestampFromAnchorValue(newAnchorValueComponents);
        if (anchorValues[anchorId].length == 0) {
            if (!validateSignature(anchorId, brickMapHash, "", timestamp, signature, publicKey)) {
                return false;
            }

            return true;
        }

        string memory lastAnchorValue = anchorValues[anchorId][anchorValues[anchorId].length - 1];
        bytes[] memory lastAnchorValueComponents = parseSSI(lastAnchorValue);

        if (!validateTimestamp(newAnchorValueComponents, lastAnchorValueComponents)) {
            return false;
        }

        if (!validateSignature(anchorId, brickMapHash, lastAnchorValue, timestamp, signature, publicKey)) {
            return false;
        }

        return true;
    }

    function appendAnchor(string memory anchorId, string memory newAnchorValue) public {
        bytes[] memory anchorIdComponents = parseSSI(anchorId);

        if (anchorValues[anchorId].length == 0) {
            emit InvokeStatus(statusCannotAppendToNonExistentAnchor);
            return;
        }

        if (isConstSSI(anchorIdComponents)) {
            emit InvokeStatus(statusCannotAppendConstAnchor);
            return;
        }

        if (!validateAnchorValue(anchorIdComponents, anchorId, newAnchorValue)) {
            emit InvokeStatus(statusTimestampOrSignatureCheckFailed);
            return;
        }

        anchorValues[anchorId].push(newAnchorValue);
        emit InvokeStatus(statusOK);
    }

    function getAllVersions(string memory anchorId) public view returns (string[] memory){
        return anchorValues[anchorId];
    }

    function getLastVersion(string memory anchorId) public view returns (string memory){
        if (anchorValues[anchorId].length == 0) {
            return '';
        }
        uint lastVersionIndex = anchorValues[anchorId].length - 1;
        return anchorValues[anchorId][lastVersionIndex];
    }

    function createOrUpdateMultipleAnchors(string[] memory anchors) public {
        for (uint i = 0; i < anchors.length - 1; i += 2) {
            string memory anchorId = anchors[i];
            string memory newAnchorValue = anchors[i + 1];
            bytes[] memory anchorIdComponents = parseSSI(anchorId);
            if (!validateAnchorValue(anchorIdComponents, anchorId, newAnchorValue)) {
                emit InvokeStatus(statusTimestampOrSignatureCheckFailed);
                return;
            }
        }

        for (uint i = 0; i < anchors.length - 1; i += 2) {
            string memory anchorId = anchors[i];
            string memory newAnchorValue = anchors[i + 1];
            if (anchorValues[anchorId].length == 0) {
                indexOfAnchor[indexedAnchors.length] = anchorId;
                indexedAnchors.push(anchorId);
            }
            anchorValues[anchorId].push(newAnchorValue);
        }

        emit InvokeStatus(statusOK);

    }

    function computeSize(string[] memory values) private returns (uint){
        uint size = 0;
        for (uint i = 0; i < values.length; i++) {
            size += bytes(values[i]).length;
        }

        return size;
    }

    function dumpAnchors(uint from, uint limit, uint maxSize) public returns (Anchor[] memory){
        uint length;
        if (limit + from > indexedAnchors.length) {
            length = indexedAnchors.length;
        } else {
            length = limit + from;
        }
        uint totalSize = 0;
        Anchor[] memory anchors = new Anchor[](length - from);
        for (uint i = from; i < length; i++) {
            string memory anchorId = indexedAnchors[i];
            string[] memory anchorVersions = anchorValues[anchorId];
            totalSize += bytes(anchorId).length + computeSize(anchorVersions);
            if (totalSize > maxSize) {
                return anchors;
            }
            Anchor memory anchor = Anchor(anchorId, anchorVersions);
            anchors[i - from] = anchor;
        }

        return anchors;
    }

    function totalNumberOfAnchors() public returns (uint){
        return indexedAnchors.length;
    }

    function splitString(string memory str, bytes1 splitChar) private returns (bytes[] memory){
        bytes memory buff = bytes(str);
        bytes memory component = new bytes(buff.length);
        uint8 len = 0;
        DynamicArray memory components;
        uint componentIndex = 0;
        for (uint i = 0; i < buff.length; i++) {
            if (buff[i] == splitChar) {
                bytes memory clone = new bytes(len);
                for (uint j = 0; j < len; j++) {
                    clone[j] = component[j];
                }
                dynamicArrayPush(components, clone);
                componentIndex++;
                len = 0;
                component = new bytes(buff.length);
            } else {
                component[len] = buff[i];
                len++;
            }
        }
        bytes memory clone = new bytes(len);
        for (uint j = 0; j < len; j++) {
            clone[j] = component[j];
        }
        dynamicArrayPush(components, clone);
        return components.array;
    }

    function validateTimestamp(bytes[] memory newAnchorValueComponents, bytes[] memory lastAnchorValueComponents) private returns (bool){
        uint anchorValueTimestamp = getTimestampFromAnchorValueAsUInt(newAnchorValueComponents);
        uint lastAnchorValueTimestamp = getTimestampFromAnchorValueAsUInt(lastAnchorValueComponents);
        if (anchorValueTimestamp < lastAnchorValueTimestamp) {
            return false;
        }

        return true;
    }

    function convertBytesToUInt(bytes memory buff) private returns (uint){
        uint number = 0;
        for (uint i = 0; i < buff.length; i++) {
            number = number * 10 + uint8(buff[i]) - 48;
        }

        return number;
    }

    function isConstSSI(bytes[] memory anchorIdComponents) private returns (bool){
        if (keccak256(anchorIdComponents[1]) == keccak256(bytes("cza"))) {
            return true;
        }

        return false;
    }

    function getTimestampFromAnchorValue(bytes[] memory ssiComponents) private returns (string memory){
        bytes memory control = ssiComponents[4];
        bytes[] memory split = splitString(string(control), 0x7c);
        return string(split[0]);
    }

    function getTimestampFromAnchorValueAsUInt(bytes[] memory ssiComponents) private returns (uint){
        string memory timestamp = getTimestampFromAnchorValue(ssiComponents);
        return convertBytesToUInt(bytes(timestamp));
    }

    function isTransfer(string memory ssi) private returns (bool){
        bytes[] memory ssiComponents = parseSSI(ssi);
        if (keccak256(ssiComponents[1]) == keccak256(bytes("transfer"))) {
            return true;
        }
        return false;
    }

    function getLastTransferSSI(string memory anchorId) private returns (string memory){
        string[] memory values = anchorValues[anchorId];
        if (values.length == 0) {
            return "";
        }

        for (uint i = values.length; i > 0; i--) {
            if (isTransfer(values[i - 1])) {
                return values[i - 1];
            }
        }

        return "";
    }

    function getPublicKey(bytes[] memory anchorIdComponents, string memory anchorId) private returns (bytes memory){
        string memory lastTransferSSI = getLastTransferSSI(anchorId);
        if (keccak256(bytes(lastTransferSSI)) != keccak256(bytes(""))) {
            bytes[] memory lastTransferSSIComponents = parseSSI(lastTransferSSI);
            return getSignatureFromAnchorValue(lastTransferSSIComponents);
        } else {
            return decode(anchorIdComponents[4]);
        }
    }

    function getSignatureFromAnchorValue(bytes[] memory ssiSegments) private returns (bytes memory){
        bytes memory control = ssiSegments[4];
        bytes[] memory components = splitString(string(control), 0x7c);
        bytes memory rsSignature = decode(components[1]);

        return rsSignature;
    }

    function parseSSI(string memory ssi) private returns (bytes[] memory){
        return splitString(ssi, 0x3a);
    }

    function encode(bytes memory source) private view returns (bytes memory){
        bytes memory sourceBytes = bytes(source);
        if (sourceBytes.length == 0) {
            return '';
        }
        uint ifactor = 133;
        uint normalizer = 100;
        uint size = (sourceBytes.length * ifactor + normalizer) / normalizer;
        uint rest = sourceBytes.length % 3;
        uint8[] memory digits = new uint8[](size);
        uint8 length = 0;
        uint8 previousLength = 0;
        bytes memory b64WithoutPadding = new bytes(size);
        for (uint i = 0; i <= sourceBytes.length; i += 3) {
            uint number = 0;
            uint j;
            for (j = i; j < i + 3 && j < sourceBytes.length; j++) {
                number = number * 256 + uint8(sourceBytes[j]);
            }

            if (j % 3 == 1) {
                number *= 16;
            } else if (j % 3 == 2) {
                number *= 4;
            }
            previousLength = length;
            while (number > 0) {
                digits[length] = uint8(number % 64);
                length++;
                number = number / 64;
            }
            for (uint k = previousLength; k < length; k++) {
                b64WithoutPadding[k] = ALPHABET[digits[length + previousLength - 1 - k]];
            }

        }
        uint paddingLength = 0;
        if (length % 4 > 0) {
            paddingLength = 4 - length % 4;
        }
        bytes memory b64 = new bytes(length + paddingLength);
        for (uint i = 0; i < length; i++) {
            b64[i] = b64WithoutPadding[i];
        }
        for (uint i = length; i < length + paddingLength; i++) {
            b64[i] = 0x3d;
        }
        return b64;
    }

    function decode(bytes memory sourceBytes) private view returns (bytes memory){
        if (sourceBytes.length == 0) {
            return '';
        }
        uint8 paddingLength = 0;
        for (uint i = 0; i < sourceBytes.length; i++) {
            if (sourceBytes[i] == 0x3d) {
                paddingLength++;
            }
        }
        uint factor = 75;
        uint normalizer = 100;
        uint rest = (sourceBytes.length - paddingLength) % 4;
        uint size = (sourceBytes.length - paddingLength - rest) * 3 / 4;
        if (paddingLength == 2) {
            size++;
        } else if (paddingLength == 1) {
            size += 2;
        }
        uint8[] memory digits = new uint8[](size);
        uint8 length = 0;
        bytes memory b256 = new bytes(size);
        for (uint i = 0; i < sourceBytes.length - paddingLength; i = i + 4) {
            uint number = 0;
            uint j = 0;
            for (j = i; j < i + 4 && j < sourceBytes.length - paddingLength - 1; j++) {
                number = number * 64 + BASE_MAP[sourceBytes[j]];
            }

            if (j % 4 == 1) {
                number = number * 4 + BASE_MAP[sourceBytes[j]] / 16;
            } else if (j % 4 == 2) {
                number = number * 16 + BASE_MAP[sourceBytes[j]] / 4;
            } else if (j % 4 == 3) {
                number = number * 64 + BASE_MAP[sourceBytes[j]];
            }

            uint8 previousLength = length;
            while (length - previousLength < 3 && length < size) {
                digits[length] = uint8(number % 256);
                length++;
                number = number / 256;
            }

            for (uint k = previousLength; k < length; k++) {
                b256[k] = bytes1(digits[length + previousLength - 1 - k]);
            }

        }

        bytes memory res = new bytes(length);
        for (uint i = 0; i < length; i++) {
            res[i] = b256[i];
        }

        return res;
    }

    function verifySignatureForV(string memory anchorId, string memory brickMapHash, string memory lastAnchorValue, string memory timestamp, bytes memory signature, uint8 v, bytes memory publicKey) private returns (bool){
        bool res = calculateAddress(publicKey) == getAddressFromHashAndSig(anchorId, brickMapHash, lastAnchorValue, timestamp, signature, v);
        if (!res) {
            res = sha256(abi.encodePacked(publicKey)) == sha256(abi.encodePacked(getAddressFromHashAndSig(anchorId, brickMapHash, lastAnchorValue, timestamp, signature, v)));
        }
        return res;
    }

    function validateSignature(string memory anchorId, string memory brickMapHash, string memory lastAnchorValue, string memory timestamp, bytes memory signature, bytes memory publicKey) private returns (bool) {
        uint8 v = 27;
        bool res = verifySignatureForV(anchorId, brickMapHash, lastAnchorValue, timestamp, signature, v, publicKey);
        if (!res) {
            v = 28;
            res = verifySignatureForV(anchorId, brickMapHash, lastAnchorValue, timestamp, signature, v, publicKey);
        }

        return res;
    }

    function getAddressFromHashAndSig(string memory anchorId, string memory brickMapHash, string memory lastAnchorValue, string memory timestamp, bytes memory signature, uint8 v) private returns (address) {
        //return the public key derivation

        return recover(getHashToBeChecked(anchorId, brickMapHash, lastAnchorValue, timestamp), signature, v);
    }

    function getHashToBeChecked(string memory anchorId, string memory brickMapHash, string memory lastAnchorValue, string memory timestamp) private returns (bytes32) {
        //use abi.encodePacked to not pad the inputs
        if (keccak256(bytes(lastAnchorValue)) == keccak256(bytes(""))) {
            return sha256(abi.encodePacked(anchorId, brickMapHash, timestamp));
        } else {
            return sha256(abi.encodePacked(anchorId, brickMapHash, lastAnchorValue, timestamp));
        }
    }
    // calculate the ethereum like address starting from the public key
    function calculateAddress(bytes memory pub) private pure returns (address addr) {
        // address is 65 bytes
        // lose the first byte 0x04, use only the 64 bytes
        // sha256 (64 bytes)
        // get the 20 bytes
        bytes memory pubk = get64(pub);

        bytes32 hash = keccak256(pubk);
        assembly {
            mstore(0, hash)
            addr := mload(0)
        }
    }

    function get64(bytes memory pub) private pure returns (bytes memory) {
        //format 0x04bytes32bytes32
        bytes32 first32;
        bytes32 second32;
        assembly {
        //intentional 0x04bytes32 -> bytes32. We drop 0x04
            first32 := mload(add(pub, 33))
            second32 := mload(add(pub, 65))
        }

        return abi.encodePacked(first32, second32);
    }

    function recover(bytes32 hash, bytes memory signature, uint8 v) public returns (address) {
        bytes32 r;
        bytes32 s;

        // Check the signature length
        if (signature.length != 64) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
        }

        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            // solium-disable-next-line arg-overflow
            return ecrecover(hash, v, r, s);
        }
    }
}
