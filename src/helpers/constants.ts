// tslint:disable object-literal-sort-keys

/**
 * @namespace constants
 * @memberof module:helpers
 * @property {number} activeDelegates - The default number of delegates.
 * @property {number} maxVotesPerTransaction - The maximum number of votes in vote type transaction.
 * @property {number} addressLength - The default address length.
 * @property {number} blockHeaderLength - The default block header length.
 * @property {number} blockReceiptTimeOut
 * @property {number} confirmationLength
 * @property {Date} epochTime
 * @property {object} fees - The default values for fees.
 * @property {number} fees.send
 * @property {number} fees.vote
 * @property {number} fees.secondsignature
 * @property {number} fees.delegate
 * @property {number} fees.multisignature
 * @property {number} fees.dapp
 * @property {number} feeStart
 * @property {number} feeStartVolume
 * @property {number} fixedPoint
 * @property {number} maxAddressesLength
 * @property {number} maxAmount
 * @property {number} maxConfirmations
 * @property {number} maxPayloadLength
 * @property {number} maxPeers
 * @property {number} maxRequests
 * @property {number} maxSharedTxs
 * @property {number} maxSignaturesLength
 * @property {number} maxTxsPerBlock
 * @property {number} minBroadhashConsensus
 * @property {string[]} nethashes - Mainnet and Testnet.
 * @property {number} numberLength
 * @property {number} requestLength
 * @property {object} rewards
 * @property {number[]} rewards.milestones - Initial 5, and decreasing until 1.
 * @property {number} rewards.offset - Start rewards at block (n).
 * @property {number} rewards.distance - Distance between each milestone
 * @property {number} signatureLength
 * @property {number} totalAmount
 * @property {number} unconfirmedTransactionTimeOut - 1080 blocks
 */
export default {
  activeDelegates              : 201,
  maximumVotes                 : 51,
  maxVotesPerTransaction       : 51,
  addressLength                : 208,
  blockHeaderLength            : 248,
  blockSlotWindow              : 5, // window of which a slot could be accepted.
  blockTime                    : 15,
  blockReceiptTimeOut          : 15 * 2, // 2 blocks
  confirmationLength           : 77,
  epochTime                    : new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0)),
  minVersion                   : [
    { height: 1, ver: '^0.1.0' },
    { height: 669400, ver: '^0.1.1' },
    { height: 1284200, ver: '^0.1.2' },
    { height: 1364200, ver: '^0.1.3' },
    { height: 2000000, ver: '>=1.0.2' },
  ],
  fees                         : [
    {
      height: 1,
      fees  : {
        send           : 10000000,
        vote           : 100000000,
        secondsignature: 10000000,
        delegate       : 500000000,
        multisignature : 100000000,
        dapp           : 2500000000,
      },
    },
  ],
  feeStart                     : 1,
  feeStartVolume               : 10000 * 100000000,
  fixedPoint                   : Math.pow(10, 8),
  maxAddressesLength           : 208 * 128,
  maxAmount                    : 100000000,
  maxConfirmations             : 77 * 100,
  maxPayloadLength             : 1024 * 1024,
  maxPeers                     : 200,
  maxRequests                  : 10000 * 12,
  maxSharedTxs                 : 100,
  maxSignaturesLength          : 196 * 256,
  maxTxsPerBlock               : 25,
  minBroadhashConsensus        : 51,
  nethashes                    : [
    // Mainnet
    '4c1170a3edb03f961e5e3f7cedcd25563f0a46ec4aa3342715d09c47b398ea19',
    // Testnet
    '0daee950841005a3f56f6588b4b084695f0d74aaa38b21edab73446064638552',
  ],
  numberLength                 : 100000000,
  requestLength                : 104,
  rewards                      : [
    { height: 1, reward: 0 },
    { height: 10, reward: 500000000 },
    { height: 11, reward: 30000000 },
    { height: 12, reward: 20000000 },
    { height: 13, reward: 500000000 },
    { height: 2103840, reward: 400000000 },
    { height: 2103840 * 2, reward: 150000000 },
    { height: 2103840 * 3, reward: 100000000 },
  ],
  signatureLength              : 196,
  totalAmount                  : 9999999983700000,
  unconfirmedTransactionTimeOut: 10800, // 1080 blocks
  multisigConstraints          : {
    min      : {
      minimum: 1,
      maximum: 15,
    },
    lifetime : {
      minimum: 1,
      maximum: 72,
    },
    keysgroup: {
      minItems: 1,
      maxItems: 15,
    },
  },
};
