console.log(userInfos);
let constract = new web3.eth.Contract(abi, deFinance.options.address, {from: sellerReliance});
console.log("Reliance Acc ", sellerReliance);
constract.methods.getUserInfo().call().then(user => console.log("Reliance User ", user));
