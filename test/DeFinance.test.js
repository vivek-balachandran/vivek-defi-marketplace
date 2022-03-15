const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const {abi, evm} = require('../compile');

const web3 = new Web3(ganache.provider());

let accounts;
let deFinance;
let admin;
let sellerReliance;
let buyerVivek;
gasLimit = 5000000;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  admin = accounts[0];
  sellerReliance = accounts[1];
  buyerVivek = accounts[2];
  deFinance = await new web3.eth.Contract(abi)
                            .deploy({data: evm.bytecode.object})
                            .send({gas: gasLimit, from: admin});
});

let getUserInfo = async (from) => {
  return deFinance.methods.getUserInfo().call({from: from});
}

let convertToWeiFromEther = (amount) => {
  return web3.utils.toWei(amount, 'ether');
}

let executeSubscribe = async (productId, productName, price, assuredAmnt, seller, expiry, etherAmt) => {
  return deFinance.methods
                 .subscribe(productId, productName, convertToWeiFromEther(price), convertToWeiFromEther(assuredAmnt), seller, expiry)
                 .send({from: seller, gas: gasLimit, value:convertToWeiFromEther(etherAmt)});
}


describe('DeFinance contract', () => {
  it('Deploys contract', () => {
    assert.ok(deFinance.options.address);
  });

  it('Sign Up Seller', async () => {
    userInfos = await getUserInfo(sellerReliance);//deFinance.methods.getUserInfo().call({from: sellerReliance});
    assert.notEqual(userInfos.user, sellerReliance);
    await deFinance.methods.signup("Ambani", "ambani@reliance.com", 1).send({from: sellerReliance, gas: gasLimit});
    userInfos = await getUserInfo(sellerReliance);//deFinance.methods.getUserInfo().call({from: sellerReliance});
    assert.equal(userInfos.user, sellerReliance);
  });

  it('Sign Up Buyer', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    userInfos = await getUserInfo(buyerVivek);
    assert.equal(userInfos.user, buyerVivek);
  });

  it('Sign Up ADMIN', async () => {
    try {
      await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: admin, gas: gasLimit});
    } catch (err) {
      assert(err);
    }
  });

  it('Seller new subscription', async () => {
    userInfos = await getUserInfo(sellerReliance);
    assert.notEqual(userInfos.user, sellerReliance);
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    const isSellerExist = await deFinance.methods.isSellerSubscribed(sellerReliance, 1234).call({from: sellerReliance});
    assert(isSellerExist);
  });

  it('Seller subscription exist', async () => {
    userInfos = await getUserInfo(sellerReliance);
    assert.notEqual(userInfos.user, sellerReliance);
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    const isSellerExist = await deFinance.methods.isSellerSubscribed(sellerReliance, 1234).call({from: sellerReliance});
    assert(isSellerExist);
    try {
      await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    } catch (err) {
      assert(err);
    }
  });

  it('Buyer new subscription', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isSellerSubscribed(buyerVivek, 1234).call({from: buyerVivek});
    assert(isBuyerExist);
  });

  it('Buyer subscription exist', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isAlreadySubscribed(1234).call({from: buyerVivek});
    assert(isBuyerExist);
    try {
      await deFinance.methods
                     .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                     .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    } catch (err) {
      assert(err);
    }
  });

  it('Buyer claim', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isAlreadySubscribed(1234).call({from: buyerVivek});
    assert(isBuyerExist);
    let isClaimed = await deFinance.methods.getClaimProductResult(1234).call({from: buyerVivek});
    assert(!isClaimed);
    await deFinance.methods.claimRequest(1234).send({from: buyerVivek, gas: gasLimit});
    isClaimed = await deFinance.methods.getClaimProductResult(1234).call({from: buyerVivek});
    assert(isClaimed);
  });

  it('Buyer claimed already', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isAlreadySubscribed(1234).call({from: buyerVivek});
    assert(isBuyerExist);
    await deFinance.methods.claimRequest(1234).send({from: buyerVivek, gas: gasLimit});
    let isClaimed = await deFinance.methods.getClaimProductResult(1234).call({from: buyerVivek});
    assert(isClaimed);
    try {
      await deFinance.methods.claimRequest(1234).send({from: buyerVivek, gas: gasLimit});
    } catch (err) {
      assert(err)
    }
  });

  it('Buyer claim Settle', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Ambani", "ambani@reliance.com", 1).send({from: sellerReliance, gas: gasLimit});
    userInfos = await getUserInfo(sellerReliance);
    assert.equal(userInfos.user, sellerReliance);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isAlreadySubscribed(1234).call({from: buyerVivek});
    assert(isBuyerExist);
    await deFinance.methods.claimRequest(1234).send({from: buyerVivek, gas: gasLimit});
    let isClaimed = await deFinance.methods.getClaimProductResult(1234).call({from: buyerVivek});
    assert(isClaimed);

    isClaimed = await deFinance.methods.getSettledClaimStatus(buyerVivek, 1234).call({from: sellerReliance});
    assert(!isClaimed);
    await deFinance.methods.settleClaim(buyerVivek, 1234).send({from: sellerReliance, gas: gasLimit, value:convertToWeiFromEther("1")});
    isClaimed = await deFinance.methods.getSettledClaimStatus(buyerVivek, 1234).call({from: sellerReliance});
    assert(isClaimed);
  });

  it('Buyer claim Settle Ether validation', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Ambani", "ambani@reliance.com", 1).send({from: sellerReliance, gas: gasLimit});
    userInfos = await getUserInfo(sellerReliance);
    assert.equal(userInfos.user, sellerReliance);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isAlreadySubscribed(1234).call({from: buyerVivek});
    assert(isBuyerExist);
    await deFinance.methods.claimRequest(1234).send({from: buyerVivek, gas: gasLimit});
    let isClaimed = await deFinance.methods.getClaimProductResult(1234).call({from: buyerVivek});
    assert(isClaimed);

    isClaimed = await deFinance.methods.getSettledClaimStatus(buyerVivek, 1234).call({from: sellerReliance});
    assert(!isClaimed);
    try {
      await deFinance.methods.settleClaim(buyerVivek, 1234).send({from: sellerReliance, gas: gasLimit});
    } catch (err) {
      assert(err);
    }
  });

  it('Buyer claim Settle non seller validation', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Ambani", "ambani@reliance.com", 1).send({from: sellerReliance, gas: gasLimit});
    userInfos = await getUserInfo(sellerReliance);
    assert.equal(userInfos.user, sellerReliance);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isAlreadySubscribed(1234).call({from: buyerVivek});
    assert(isBuyerExist);
    await deFinance.methods.claimRequest(1234).send({from: buyerVivek, gas: gasLimit});
    let isClaimed = await deFinance.methods.getClaimProductResult(1234).call({from: buyerVivek});
    assert(isClaimed);
    try {
      await deFinance.methods.settleClaim(buyerVivek, 1234).send({from: buyerVivek, gas: gasLimit});
    } catch (err) {
      assert(err);
    }
  });

  it('Reject claim', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Ambani", "ambani@reliance.com", 1).send({from: sellerReliance, gas: gasLimit});
    userInfos = await getUserInfo(sellerReliance);
    assert.equal(userInfos.user, sellerReliance);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isAlreadySubscribed(1234).call({from: buyerVivek});
    assert(isBuyerExist);
    await deFinance.methods.claimRequest(1234).send({from: buyerVivek, gas: gasLimit});
    const isClaimed = await deFinance.methods.getClaimProductResult(1234).call({from: buyerVivek});
    assert(isClaimed);
    let isClaimExist = await deFinance.methods.hasSellerClaims(buyerVivek, 1234).call({from: sellerReliance, gas: gasLimit});
    assert(isClaimExist);
    await deFinance.methods.rejectClaim(buyerVivek, 1234).send({from: sellerReliance, gas: gasLimit});
    isClaimExist = await deFinance.methods.hasSellerClaims(buyerVivek, 1234).call({from: sellerReliance, gas: gasLimit});
    assert(!isClaimExist);
  });

  it('Reject claim already settled validation', async () => {
    userInfos = await getUserInfo(buyerVivek);
    assert.notEqual(userInfos.user, buyerVivek);
    await deFinance.methods.signup("Ambani", "ambani@reliance.com", 1).send({from: sellerReliance, gas: gasLimit});
    userInfos = await getUserInfo(sellerReliance);
    assert.equal(userInfos.user, sellerReliance);
    await deFinance.methods.signup("Vivek", "vivek@reliance.com", 2).send({from: buyerVivek, gas: gasLimit});
    await executeSubscribe(1234, "Reliance Mutual Fund", '1', '1', sellerReliance, 2, '1');
    await deFinance.methods
                   .subscribe(1234, "Reliance Mutual Fund", convertToWeiFromEther("1"), convertToWeiFromEther("1"), sellerReliance, 2)
                   .send({from: buyerVivek, gas: gasLimit, value:convertToWeiFromEther("1")});
    const isBuyerExist = await deFinance.methods.isAlreadySubscribed(1234).call({from: buyerVivek});
    assert(isBuyerExist);
    await deFinance.methods.claimRequest(1234).send({from: buyerVivek, gas: gasLimit});
    let isClaimed = await deFinance.methods.getClaimProductResult(1234).call({from: buyerVivek});
    assert(isClaimed);
    await deFinance.methods.settleClaim(buyerVivek, 1234).send({from: sellerReliance, gas: gasLimit, value:convertToWeiFromEther("1")});
    isClaimed = await deFinance.methods.getSettledClaimStatus(buyerVivek, 1234).call({from: sellerReliance});
    assert(isClaimed);
    let isClaimExist = await deFinance.methods.hasSellerClaims(buyerVivek, 1234).call({from: sellerReliance, gas: gasLimit});
    assert(isClaimExist);
    try {
      await deFinance.methods.rejectClaim(buyerVivek, 1234).send({from: sellerReliance, gas: gasLimit});
    } catch (err) {
      assert(err);
    }
  });

});
