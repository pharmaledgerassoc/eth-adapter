// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/* Signature Verification

How to Sign and Verify
# Signing
1. Create message to sign
2. Hash the message
3. Sign the hash (off chain, keep your private key secret)

# Verify
1. Recreate hash from the original message
2. Recover signer from signature and hash
3. Compare recovered signer to claimed signer
*/

contract VerifySignature {
    event Result(bool str);

    function validateSignature(string memory data, bytes memory signature, bytes memory publicKey) public returns (bool)
    {
        bool res = calculateAddress(publicKey) == getAddressFromHashAndSig(data, signature);
        emit Result(res);
        return res;
    }

    function getAddressFromHashAndSig(string memory data, bytes memory signature) private view returns (address)
    {
        //return the public key derivation
        return recover(getHashToBeChecked(data), signature);
    }

    function getHashToBeChecked(string memory data) private view returns (bytes32)
    {
        //use abi.encodePacked to not pad the inputs
        return sha256(abi.encodePacked(data));
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

    function get64(bytes memory pub) private pure returns (bytes memory)
    {
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

    function recover(bytes32 hash, bytes memory signature) private pure returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Check the signature length
        if (signature.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v == 27) {
            v = 28;
        }else{
            v=27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            // solium-disable-next-line arg-overflow
            return ecrecover(hash, v, r, s);
        }
    }

}
