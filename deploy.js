const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const {abi, evm} = require('./compile');

const mneomic = "million disorder sentence margin check device gate hip render era husband kiss";
const rinkebyUrl = "https://rinkeby.infura.io/v3/0cd90b1993c041b585ad7cf7576dd084";
const ropstenUrl = 'https://ropsten.infura.io/v3/0cd90b1993c041b585ad7cf7576dd084';

console.log('connecting to provider...');
const provider = new HDWalletProvider(
  'million disorder sentence margin check device gate hip render era husband kiss',
  'https://ropsten.infura.io/v3/0cd90b1993c041b585ad7cf7576dd084');
console.log('connected...');

const web3 = new Web3(provider);
console.log('Web 3 is generated with provider HD');

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);
  console.log('abi: ', abi);
  //console.log('evm.bytecode.object: ', evm.bytecode.object);
  const result = await new web3.eth.Contract(abi)
                    .deploy({data: evm.bytecode.object})
                    .send({gas: '5000000', from: accounts[0]});

  console.log('result ', result);
  console.log('Contract deployed to ', result.options.address);
  provider.engine.stop();
};
deploy();

//deployed Ropsten address is : 0x69400EDd8BEF480aA35be50D1c0677e6B6fc1021
//Contract deployed to  0x69400EDd8BEF480aA35be50D1c0677e6B6fc1021
