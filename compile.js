const path = require('path');
const fs = require('fs');
const solc = require('solc');

const inboxPath = path.resolve(__dirname, 'contracts', 'DeFinance.sol');
const source = fs.readFileSync(inboxPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'DeFinance.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
};

const compiledCode = solc.compile(JSON.stringify(input));
//console.log(compiledCode);
module.exports = JSON.parse(compiledCode).contracts['DeFinance.sol'].DeFinance;
