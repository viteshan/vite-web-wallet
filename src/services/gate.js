import { getClient } from 'utils/request';
import { accountBlock } from '@vite/vitejs';
import { wallet } from 'utils/wallet';
import rpcClient from 'utils/viteClient';
import { addrSpace } from 'utils/storageSpace';
import { purePow } from 'components/pow';


const STORAGEKEY = 'INDEX_COLLECT_TOKEN';
// import { powProcess } from 'components/pow/index';
// const VoteDifficulty = '201564160';

const client = getClient('', xhr => {
    if (xhr.status === 200) {
        const { code, msg, data, error, subCode } = JSON.parse(xhr.responseText);
        if (code !== 0) {
            return Promise.reject({
                code,
                subCode,
                message: msg || error
            });
        }
        return Promise.resolve(data || null);
    }
    return Promise.reject(xhr.responseText);
});
export const getGateInfos = url => client({ path: 'certified_gateways', host: url });

export const getChargeAddr = ({ tokenId, addr: walletAddress }, url) => client({ path: 'deposit_address', params: { tokenId, walletAddress }, host: url });

export const verifyAddr = ({ tokenId, withdrawAddress }, url) => client({ path: 'verify_withdraw_address', params: { tokenId, withdrawAddress }, host: url });

export const getWithdrawInfo = ({ tokenId, walletAddress }, url) => client({ path: 'withdraw_info', params: { tokenId, walletAddress }, host: url });

export const getWithdrawFee = ({ tokenId, walletAddress, amount, containsFee = false }, url) => client({ path: 'withdraw_fee', params: { tokenId, walletAddress, amount, containsFee }, host: url });

export const getChargeInfo = ({ tokenId, addr: walletAddress }, url) => client({ path: 'deposit_info', params: { tokenId, walletAddress }, host: url });
export const withdraw = async ({ amount, withdrawAddress, gateAddr, tokenId }, url) => {
    const account = wallet.activeAccount;
    const address = account.getDefaultAddr();
    const unlockAcc = account.account.unlockAcc;
    const accountBlockContent = await rpcClient.buildinTxBlock.sendTx.async({ toAddress: gateAddr, amount, accountAddress: address, tokenId });
    const quota = await rpcClient.pledge.getPledgeQuota(address);
    if (quota.txNum < 1) {
    // eslint-disable-next-line no-unused-vars
        await purePow({ accountBlock: accountBlockContent });
    }

    const signedBlock = accountBlock.signAccountBlock(accountBlockContent, unlockAcc.privateKey);

    const rawTx = JSON.stringify(signedBlock);
    const signInfo = { rawTx, withdrawAddress };
    const signature = unlockAcc.sign(Buffer(JSON.stringify(signInfo)).toString('hex'));
    return await client({ method: 'post', path: 'withdraw', params: { rawTx, withdrawAddress, signature }, host: url });
};


// data{tokenId:{symbol,url}}
class GateWays {
    constructor() {
        this.updateFromStorage();
        this.data = {};
    }

    bindToken(tokenId, tokenInfo) {
        this.updateFromStorage();
        this.data[tokenId] = tokenInfo;
        this.saveToStorage();
    }

    bindTokens(tokenMap) {
        this.updateFromStorage();
        this.data = { ...tokenMap, ...this.data };
        this.saveToStorage();
    }

    unbindToken(tokenId) {
        this.updateFromStorage();
        delete this.data[tokenId];
        this.saveToStorage();
    }

    saveToStorage() {
        addrSpace.setItem(STORAGEKEY, this.data);
    }

    updateFromStorage() {
        this.data = addrSpace.getItem(STORAGEKEY);
        if (!this.data) {
            addrSpace.setItem(STORAGEKEY, {});
            this.data = {};
        }
    }
}

export const gateStorage = new GateWays();
window.storageeeeee = gateStorage;

class testStruct {
    constructor({ tokenId, withdrawAddress }) {
        this.chargeAddr = '',
        this.withdrawInfo = null,
        this.withdrawFee = 0,
        this.gateInfos = null,
        this.tokenId = tokenId;
        this.withdrawAddress = withdrawAddress;
        this.amount = '500000000000000000';
    }

    get account() {
        return wallet.activeAccount;
    }

    get address() {
        return wallet.activeAccount.getDefaultAddr();
    }

    getGateInfos() {
        getGateInfos().then(data => {
            console.log(data);
        });
    }

    getChargeAddr() {
        getChargeAddr({ tokenId: this.tokenId, addr: this.address }).then(data => {
            this.chargeAddr = data;
            console.log(data);
        });
    }

    verifyAddr() {
        verifyAddr({ tokenId: this.tokenId, withdrawAddress: this.withdrawAddress }).then(data => console.log(data));
    }

    getWithdrawInfo() {
        getWithdrawInfo({ tokenId: this.tokenId, withdrawAddress: this.withdrawAddress }).then(data => {
            this.withdrawInfo = data;
            console.log(data);
        });
    }

    getWithdrawFee() {
        getWithdrawFee({ tokenId: this.tokenId, withdrawAddress: this.withdrawAddress, amount: this.amount }).then(data => {
            this.withdrawFee = data;
            console.log(data);
        });
    }

    withdraw(amount) {
        withdraw({ amount: amount || this.amount, withdrawAddress: this.withdrawAddress, gateAddr: this.withdrawInfo.gatewayAddress, tokenId: this.tokenId }).then(data => console.log(data));
    }
}

window.ethTest = new testStruct({ tokenId: 'tti_82b16ac306f0d98bf9ccf7e7', withdrawAddress: '0xdd50024B09B29549A14f8405fa9056a811E6F03F' });
window.btcText = new testStruct({ tokenId: 'tti_4e88a475c675971dab7ec917', withdrawAddress: 'muhJJ374MUF7sEUqn1WuYsnuJbGxoPCbRV' });