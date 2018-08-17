'use strict';
var _ = require('lodash');

var BufferUtil = require('./util/buffer');
var JSUtil = require('./util/js');
var networks = [];
var networkMaps = {};

/**
 * A network is merely a map containing values that correspond to version
 * numbers for each bitcoin network. Currently only supporting "livenet"
 * (a.k.a. "mainnet") and "testnet".
 * @constructor
 */
function Network() {}

Network.prototype.toString = function toString() {
    return this.name;
};

/**
 * @function
 * @member Networks#get
 * Retrieves the network associated with a magic number or string.
 * @param {string|number|Network} arg
 * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
 * @return Network
 */
function get(arg, keys) {

    if (~networks.indexOf(arg)) {
        return arg;
    }
    if (keys) {
        if (!_.isArray(keys)) {
            keys = [keys];
        }
        var containsArg = function (key) {
            return networks[index][key] === arg;
        };
        for (var index in networks) {
            if (_.any(keys, containsArg)) {
                return networks[index];
            }
        }
        return undefined;
    }
    return networkMaps[arg];
}

/**
 * @function
 * @member Networks#add
 * Will add a custom Network
 * @param {Object} data
 * @param {string} data.name - The name of the network
 * @param {string} data.alias - The aliased name of the network
 * @param {Number} data.pubkeyhash - The publickey hash prefix
 * @param {Number} data.privatekey - The privatekey prefix
 * @param {Number} data.scripthash - The scripthash prefix
 * @param {Number} data.xpubkey - The extended public key magic
 * @param {Number} data.xprivkey - The extended private key magic
 * @param {Number} data.networkMagic - The network magic number
 * @param {Number} data.port - The network port
 * @param {Array}  data.dnsSeeds - An array of dns seeds
 * @return Network
 */
function addNetwork(data) {

    var network = new Network();

    JSUtil.defineImmutable(network, {
        name: data.name,
        alias: data.alias,
        coin: data.coin,
        coinName: data.coinName,
        shortName: data.shortName,
        algorithm: data.algorithm,
        txtimestamp: data.txtimestamp,
        pubkeyhash: data.pubkeyhash,
        privatekey: data.privatekey,
        scripthash: data.scripthash,
        skipSignTime: data.skipSignTime,
        prefix: data.prefix,
        url: data.url,
        xpubkey: data.xpubkey,
        xprivkey: data.xprivkey
    });

    if (data.networkMagic) {
        JSUtil.defineImmutable(network, {
            networkMagic: BufferUtil.integerAsBuffer(data.networkMagic)
        });
    }

    if (data.port) {
        JSUtil.defineImmutable(network, {
            port: data.port
        });
    }

    if (data.dnsSeeds) {
        JSUtil.defineImmutable(network, {
            dnsSeeds: data.dnsSeeds
        });
    }
    _.each(network, function (value) {
        if (!_.isUndefined(value) && !_.isObject(value)) {
            networkMaps[value] = network;
        }
    });

    networks.push(network);

    return network;

}

/**
 * @function
 * @member Networks#remove
 * Will remove a custom network
 * @param {Network} network
 */
function removeNetwork(network) {
    for (var i = 0; i < networks.length; i++) {
        if (networks[i] === network) {
            networks.splice(i, 1);
        }
    }
    for (var key in networkMaps) {
        if (networkMaps[key] === network) {
            delete networkMaps[key];
        }
    }
}

addNetwork({
    name: 'livenet',
    alias: 'mainnet',
    coin: 'btc',
    url: 'bitcoin',
    coinName: 'BITCOIN',
    shortName: 'BTC',
    prefix: '1',
    pubkeyhash: 0x00,
    privatekey: 0x80,
    scripthash: 0x05,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0xf9beb4d9,
    port: 8333,
    dnsSeeds: [
        'seed.bitcoin.sipa.be',
        'dnsseed.bluematt.me',
        'dnsseed.bitcoin.dashjr.org',
        'seed.bitcoinstats.com',
        'seed.bitnodes.io',
        'bitseed.xf2.org'
    ]
});



/**
 * @instance
 * @member Networks#livenet
 */
var livenet = get('livenet');

addNetwork({
    name: 'testnet',
    alias: 'regtest',
    prefix: 't',
    pubkeyhash: 0x6f,
    privatekey: 0xef,
    scripthash: 0xc4,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394
});

/**
 * @instance
 * @member Networks#testnet
 */
var testnet = get('testnet');

// Add configurable values for testnet/regtest

var TESTNET = {
    PORT: 18333,
    NETWORK_MAGIC: BufferUtil.integerAsBuffer(0x0b110907),
    DNS_SEEDS: [
        'testnet-seed.bitcoin.petertodd.org',
        'testnet-seed.bluematt.me',
        'testnet-seed.alexykot.me',
        'testnet-seed.bitcoin.schildbach.de'
    ]
};

for (var key in TESTNET) {
    if (!_.isObject(TESTNET[key])) {
        networkMaps[TESTNET[key]] = testnet;
    }
}

var REGTEST = {
    PORT: 18444,
    NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xfabfb5da),
    DNS_SEEDS: []
};

for (var key in REGTEST) {
    if (!_.isObject(REGTEST[key])) {
        networkMaps[REGTEST[key]] = testnet;
    }
}

Object.defineProperty(testnet, 'port', {
    enumerable: true,
    configurable: false,
    get: function () {
        if (this.regtestEnabled) {
            return REGTEST.PORT;
        } else {
            return TESTNET.PORT;
        }
    }
});

Object.defineProperty(testnet, 'networkMagic', {
    enumerable: true,
    configurable: false,
    get: function () {
        if (this.regtestEnabled) {
            return REGTEST.NETWORK_MAGIC;
        } else {
            return TESTNET.NETWORK_MAGIC;
        }
    }
});

Object.defineProperty(testnet, 'dnsSeeds', {
    enumerable: true,
    configurable: false,
    get: function () {
        if (this.regtestEnabled) {
            return REGTEST.DNS_SEEDS;
        } else {
            return TESTNET.DNS_SEEDS;
        }
    }
});

/**
 * @function
 * @member Networks#enableRegtest
 * Will enable regtest features for testnet
 */
function enableRegtest() {
    testnet.regtestEnabled = true;
}

/**
 * @function
 * @member Networks#disableRegtest
 * Will disable regtest features for testnet
 */
function disableRegtest() {
    testnet.regtestEnabled = false;
}


addNetwork({
    name: 'ventas',
    alias: 'ventas',
    coin: 'venc',
    coinName: 'VENTAS',
    url: 'ventas',
    shortName: 'VENC',
    algorithm: 'scrypt',
    txtimestamp: true,
    skipSignTime: true,
    prefix: 'V',
    pubkeyhash: 0x46,
    privatekey: 0xcc,
    scripthash: 0x84,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x76656e74,
    port: 13101,
    dnsSeeds: [
        'chain001.bitchk.com'
    ]
});
addNetwork({
    name: 'yangcoin',
    alias: 'yangcoin',
    coin: 'yng',
    url: 'yangcoin',
    coinName: 'YANGCOIN',
    shortName: 'YNG',
    prefix: 'Y',
    txtimestamp: true,
    skipSignTime: false,
    algorithm: "scrypt",
    pubkeyhash: 0x4e,
    privatekey: 0x8c,
    scripthash: 0xcc,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x59414e47,
    port: 23001,
    dnsSeeds: [
        'chain001.bitchk.com'
    ]
});

addNetwork({
    name: 'quasar',
    alias: 'quasar',
    coin: 'qac',
    url: 'quasar',
    coinName: 'Quasar',
    shortName: 'QAC',
    prefix: 'Q',
    txtimestamp: true,
    algorithm: "scrypt",
    pubkeyhash: 0x3a,
    privatekey: 0x78,
    scripthash: 0xcc,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x51554153,
    port: 13201,
    dnsSeeds: [
        'qac001.bitchk.com'
    ]
});

addNetwork({
    name: 'paxcoin',
    alias: 'paxcoin',
    coin: 'pax',
    url: 'paxcoin',
    coinName: 'PAXCOIN',
    shortName: 'PAX',
    prefix: 'P',
    txtimestamp: true,
    algorithm: "scrypt",
    pubkeyhash: 0x37,
    privatekey: 0x75,
    scripthash: 0xcc,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x50415843,
    port: 13501,
    dnsSeeds: [
        'pax001.bitchk.com'
    ],
    blockreward: function (height) {
        return 125;
    }
});

addNetwork({
    name: 'qctcoin',
    alias: 'qctcoin',
    coin: 'qct',
    url: 'qcity',
    coinName: 'QCITYCOIN',
    shortName: 'QCT',
    prefix: 'C',
    txtimestamp: true,
    algorithm: "scrypt",
    pubkeyhash: 0x1c,
    privatekey: 0x57,
    scripthash: 0xcc,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x71746379,
    port: 13301,
    dnsSeeds: [
        'qct001.bitchk.com'
    ]
});

addNetwork({
    name: 'searchcoin',
    alias: 'searchcoin',
    coin: 'ssc',
    url: 'searchcoin',
    coinName: 'Searchcoin',
    shortName: 'SSC',
    prefix: 'S',
    txtimestamp: true,
    algorithm: "scrypt",
    pubkeyhash: 0x3F,
    privatekey: 0x7D,
    scripthash: 0xcc,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x53454152,
    port: 13401,
    dnsSeeds: [
        'ssc001.bitchk.com'
    ]
});


addNetwork({
    name: 'litecoin',
    alias: 'litecoin',
    coin: 'ltc',
    url: 'litecoin',
    coinName: 'LITECOIN',
    shortName: 'LTC',
    algorithm: 'scrypt',
    txtimestamp: false,
    prefix: 'L',
    pubkeyhash: 0x30,
    privatekey: 0xb0,
    scripthash: 0x32,
    xpubkey: 0x019da462,
    xprivkey: 0x019d9cfe,
    networkMagic: 0xfbc0b6db,
    port: 9333,
    dnsSeeds: [
        'dnsseed.litecointools.com'
    ]
});
addNetwork({
    name: 'terabit',
    alias: 'terabit',
    coin: 'tbc',
    url: 'terabit',
    coinName: 'TERABIT',
    shortName: 'TBC',
    txtimestamp: true,
    pubkeyhash: 0x41,
    privatekey: 0xcc,
    scripthash: 0x10,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488abe4,
    networkMagic: 0x70352205,
    port: 13001,
    algorithm: 'scrypt',
    prefix: 'T',
    dnsSeeds: [
        'tera001.bitchk.com'
    ]
});

addNetwork({
    name: 'jbcoin',
    alias: 'jbcoin',
    coin: 'jbc',
    url: 'jbcoin',
    coinName: 'JinBioCoin',
    shortName: 'JBC',
    prefix: 'J',
    txtimestamp: true,
    skipSignTime: false,
    pos:true,
    algorithm: "scrypt",
    pubkeyhash: 0x2b,
    privatekey: 0x69,
    scripthash: 0xcc,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0xa4424343,
    port: 13701,
    dnsSeeds: [
        'jbc001.bitchk.com'
    ]
});

/**
 * @namespace Networks
 */
module.exports = {
    add: addNetwork,
    remove: removeNetwork,
    defaultNetwork: livenet,
    livenet: livenet,
    mainnet: livenet,
    testnet: testnet,
    get: get,
    enableRegtest: enableRegtest,
    disableRegtest: disableRegtest,
    networks: networks
};