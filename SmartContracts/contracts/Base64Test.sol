pragma solidity ^0.8.0;

contract Base64Test {
    event Result(bytes str);

    bytes constant ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    uint constant BASE = 58;
    mapping(bytes1 => uint8) BASE_MAP;

    constructor() public {
        for (uint8 i = 0; i < ALPHABET.length; i++) {
            BASE_MAP[ALPHABET[i]] = i;
        }
    }

    function encode(string memory source) public returns (bytes memory){
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

    function decode(string memory source) public returns (bytes memory){
        bytes memory sourceBytes = bytes(source);

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

    function testEncoding(string memory source) public {
        bytes memory res = encode(source);
        emit Result(res);
    }

    function testDecoding(string memory source) public {
        bytes memory res = decode(source);
        emit Result(res);
    }
}
