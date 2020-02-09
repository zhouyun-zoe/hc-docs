# JS-SDK

- [JS-SDK](#JS-SDK)
  - [Muta](#Muta)
  - [Client](#Client)
  - [Account](#Account)
  - [Wallet](#Wallet)
  - [Built-in Service](#Built-in_Service)
    - [AssetService](#AssetService)  
  - [util](#util)
  
## JS-SDK

JS-SDK是Muta-chain官方推出的基于javascript的sdk工具.他包装了Muta节点信息,可以用graphql rpc方法,账户管理以及內建service.
JS-SDK之于Muta-chain类似web3.js之于Ethereum.
Muta包含4个子项目:

1. Client, 用于和节点进行graphql api交互,类似于web3.eth.
2. Account, 进行Muta-chain的账户管理,一个账户包含了这个账户的私钥,公钥以及地址.
3. Wallet, Muta-chain的钱包功能,可以管理多个Account.
4. Builtin-Service, 提供对于Muta-chain,內建的Service,直接通行.类似与对以太坊智能合约进行合约级别的API通信.

给出一个完整用例,API请直接参考[API doc]():
1. 在运行代码片段前,请先单独启动一个使用默认参数的Muta-chain. 虽然请通过npm install muta-sdk安装sdk
2. 通过默认参数,我们构建了Muta对象,这样可以得到Client对象,用来接下来和节点进行数据交互
3. 通过HDWallet钱包,生成随机助记词,并派生一个账户Account
4. 紧接着构建一个AssetService对象,用以和资产服务进行交互
5.1 和资产服务进行业务交互,创建一个名为LOVE_COIN的UDT资产
5.2 通过资产ID来查询资产
5.3 获得一个用户资产的余额
5.4 向之前查询余额的用户发送一定量的资产

```js
async function example() {

  //!!!please refer to npm package to import related class!!!
  import { AssetService } from './builtin';
  import { Muta } from './Muta';

  //get a default Muta instance, with default Muta chain-id and GraphQL endpoint
  //you should setup a Muta chain with default config before
  const muta = Muta.createDefaultMutaInstance();

  // get a client which plays a role to sent GraphQL rpc to the Muta chain, it like you get a web3.eth in Ethereum
  const client = muta.client();

  // use HDWallet to generate random mnemonic
  const mnemonic = Muta.hdWallet.generateMnemonic();

  // use the mnemonic to build an HDWallet
  const wallet = new Muta.hdWallet(mnemonic);

  // derive an account from the HDWallet
  const account = wallet.deriveAccount(1);

  // get AssetService with given client and accout
  // the client takes responsibility to send you query/transaction to the Muta chain or node
  // the account is as the default sender of query and the only sender of transaction which you send to Muta chain or node
  const service = new AssetService(client, account);

  // the total supply is 1314, nothing special
  const supply = 1314;

  // create an asset call LOVE_COIN with LUV symbol, supply 1314 loves totally
  const createdAsset = await service.createAsset({
    name: 'LOVE_COIN',
    supply,
    symbol: 'LUV'
  });

  // keep the asset id for later use, you should keep it carefully
  const assetId = createdAsset.asset_id;

  // get the Asset info back, this should equals to createdAsset above :)
  const asset = await service.getAsset(assetId);

  // we replacing it is Okay, cause they are equal, isn't it?
  t.is(asset.asset_id, assetId);


  // get the balance of our account, should equal 1314
  const balance = await service.getBalance(assetId, account.address);
  t.is(balance, 1314);

  // we send 520 LUVs
  const to = '0x2000000000000000000000000000000000000000';

  await service.transfer({
    asset_id: assetId,
    to,
    value: 520
  });

  const balance0x2000000000000000000000000000000000000000 = await service.getBalance(assetId, to);
  t.is(balance0x2000000000000000000000000000000000000000, 520);

}
```
### Muta

Muta类型是对Muta-Chain的抽象,Muta对象保存了Muta-Chain的参数.
Muta下拥有[HDWallet]()和[util]()类型.

新建一个Muta对象:
```js
//新建一个Muta-chain节点信息

//节点的chain_id, hex string, 0x打头, 后带64个字符长度,即32字节
let chain_id = '0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036';

//节点的graphql string, rpc的endpoint,输入有效的uri
let endpoint = 'http://127.0.0.1:8000/graphql';

//发送tx默认的失效block高度, number
//timneGap,是针对tx超时的设定.如果一笔tx发送到节点之后,在timeoutGap个block内都没有被打包进block,那么该笔交易就自动被丢弃,相较于以太坊的txpool不定期清空的不确定信,timeGap给出了明确的设定
let timeoutGap = 20;

let muta = new Muta(chain_id,endpoint,timeoutGap);
```
或者

通过Muta.createDefaultMutaInstance获得默认的节点信息
```js
let muta = Muta.createDefaultMutaInstance();

//等效于

let muta =  new Muta({
                 chainId:
                   '0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036',
                 endpoint: 'http://127.0.0.1:8000/graphql',
                 timeoutGap: DEFAULT_TIMEOUT_GAP //20
               })
```

通过Muta类型获得[HDWallet]()和[util]()类型.

```js
// 通过Muta.hdWallet获得HDWallet的相关方法
const mnemonic = Muta.hdWallet.generateMnemonic();
// 通过Muta.utile获得util的相关方法
const a = Muta.util.hexToNum('a1');
```

可以通过Muta,给出Mnemonic,直接创建HDWallet
```js
const hdWallet = Muta.hdWalletFromMnemonic('your 12 English mnemonic phrases');
```

可以通过Muta,给出privateKey,直接创建Account
```js
const hdWallet = Muta.accountFromPrivateKey('your 32 bytes privateKey hex string starts with 0x prefix');
```

通过Muta实例获得一个Client对象
```js
let muta = Muta.createDefaultMutaInstance();
let client = muta.client();
```

### Client

Client不仅是对SDK向节点发送请求的js代码封装,调用其中方法,可以等效于向节点发起GraphQL rpc请求.
同时还是Client也包含一些与发送请求相关的方法.

Muta的GraphQL API根据GraphQL,一样也分成两类.
在GraphQL中:
1. Query 仅向服务器发送查询请求,不会对服务器上的数据造成任何的修改.
2. Mutation 想服务器发起修改请求,会对数据造成更改.

在Muta GraphQL API中, API分为3类.其中2类是GraphQL,还有一类是在本地运行的工具方法.这类方法不会被发送到网络

所以,根据分类:

**Query**
1. [getBlock](####getBlock), [getLatestBlockHeight](####getLatestBlockHeight) and [waitForNextNBlock](####waitForNextNBlock)
2. [getTransaction](####getTransaction)
3. [getReceipt](####getReceipt)
4. [queryService](####queryService) and [queryServiceDyn](####queryServiceDyn)

**Mutation**
1. [sendTransaction](####sendTransaction)

**Locally**
1. [composeTransaction](####composeTransaction)
获得一个Client对象:
```js
let client = muta.client();
```
#### getBlock
获取对应Height的Block信息
```js
async function example(){
  const block = await client.getBlock();
  const block2 = await client.getBlock('1');
}
```

#### getLatestBlockHeight
获取当前最新Block的高度
```js
async function example(){
  const height = await client.getLatestBlockHeight();
}
```

#### waitForNextNBlock
从请求发起计算获得当前Block高度起,等待N个Block
```js
async function example(){
  await client.waitForNextNBlock(5);//等待5个
}
```

#### getTransaction
通过txHash获取Tx信息
```js
async function example(){
  let tx = await client.getTransaction('your tx hash hex string');
}
```

#### getReceipt
通过txHash获取Tx Receipt信息.只有当一笔tx被mined了之后,才会产生Receipt信息
```js
async function example(){
  let tx = await client.getReceipt('your tx hash hex string');
}
```

#### queryService
向Muta-Chain发起自定义的queryService调用
```js
async function example(){
  let ret = await client.queryService({
    serviceName: 'string',
    method: 'string',
    payload: 'string',
    height: 'Maybe<string>',
    caller: 'Maybe<string>',
    cyclePrice: 'Maybe<string>',
    cycleLimit: 'Maybe<string>'
  });
  /*
  return data struct:
  ExecResp {
    ret: string,
    isError: boolean,
  }
  */



  let tx = await client.queryServiceDyn<P,R>({
    serviceName: 'string',
    method: 'string',
    payload: P,//P类型的对象
    height: 'Maybe<string>',
    caller: 'Maybe<string>',
    cyclePrice: 'Maybe<string>',
    cycleLimit: 'Maybe<string>'
  });
  /*
  return data struct:
  ExecResp {
    ret: R,//R类型的对象
    isError: boolean,
  }
  */

}
```

#### sendTransaction
向Muta-Chain发起一笔交易
```js
async function example(){
  let txHash = await this.client.sendTransaction(
    {
      chainId: 'string',
      cyclesLimit: 'string',
      cyclesPrice: 'string',
      nonce: 'string',
      timeout: 'string',
      serviceName: 'string',
      method: 'string',
      payload: 'string',
      txHash: 'string',
      pubkey: 'string',
      signature: 'string',
    }
  );
}
```


#### composeTransaction
通过默认参数构建一笔标准的交易
```js
async function example(){
const tx = await this.client.composeTransaction({
      method: 'transfer',//需要调用的service内的方法
      payload: 'string', //调用的数据,统一字符串化,请参考根据对应的service.method的要求
      serviceName: 'asset'//service的名产
    });
}
```


### Account

Account是Muta-Chain中对于任何账户的概念,和一些常见的区块链一样,地址是唯一的标识.
Account内包含了一个账户所拥有的私钥,以及其对应的公钥和地址.
Account的主要功能就是对一笔交易进行签名.

#### fromPrivateKey
通过私钥构建一个Account
```js
    let acc = Account.fromPrivateKey('your 32 bytes private key starts with 0x prefix')
```

#### signTransaction
通过Account对象对一笔交易进行签名
```js
    let signedTx = account.signTransaction(
      {
        chainId: 'string',
        cyclesLimit: 'string',
        cyclesPrice: 'string',
        nonce: 'string',
        timeout: 'string',
        serviceName: 'string',
        method: 'string',
        payload: 'string',
      }
      /*
      SignedTransaction  {
        chainId: string,
        cyclesLimit: string,
        cyclesPrice: string,
        nonce: string,
        timeout: string,
        serviceName: string,
        method: string,
        payload: string,
        txHash: string,
        pubkey: string,
        signature: string,
      }
      */
)
```

### Wallet
确定性分层钱包HDWallet.和大多数HDWallet一样,Muta-Chain钱包支持bip32,bip39和bip44
 * [bip32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki),
 * [bip39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
 * [bip44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)

#### generateMnemonic
随机生成一组助记词
```js
    let mnemonic = Muta.hdWallet.generateMnemonic()
```

#### constructor
通过一组助记词构建HD钱包
```js
    let mnemonic = Muta.hdWallet.generateMnemonic()
    let wallet = new Muta.hdWallet(mnemonic)
```

#### deriveAccount
通过HD钱包对象,派生子私钥/Account
```js
    let mnemonic = Muta.hdWallet.generateMnemonic()
    let wallet = new Muta.hdWallet(mnemonic)
    let account_1 = wallet.deriveAccount(1)// accountIndex = 1 
```

### Built-in_Service
Muta-Chain內建有诸多Built-in Service. 这些Service提供了某一方面完整的功能,为其他內建服务和用户自定义服务提供服务
类似与在以太坊上公开部署一个功能性的合约,并把他注册到ENS上.

#### AssetService

AssetService提供了用户快速构建UDT(user defined token)的功能.用户可以通过调用改服务,创建属于自己的UDT.
UDT是一种基于数量的无差别资产,类似于以太坊ERC20 token

##### constructor
构建一个AssetService实例,通过给定client和account,便可往client中给定的Muta-chain以account的身份进行交互
```js
    const service = new AssetService(client, account);
```

##### createAsset
构建一个Asset
```js
async function example(){
  const createdAsset = await service.createAsset({
      name: 'LOVE_COIN',
      supply,
      symbol: 'LUV'
    });
    /*return data:
    Asset {
      asset_id: Hash;
      name: string;
      symbol: string;
      supply: number;
      issuer: Address;
    }
    */
}
  
```

##### getAsset
根据asset_id,查询对应的asset
```js
async function example(){
    const asset = await service.getAsset(createdAsset.assetId);
    /*return data:
    Asset {
      asset_id: Hash;
      name: string;
      symbol: string;
      supply: number;
      issuer: Address;
    }
    */
}
  
```

##### getBalance
获取一个某一用户在某一资产下的余额
```js
async function example(){
  const balance = await service.getBalance(createdAsset.assetId, account.address);
}
  
```

##### transfer
以在构造函数中给定的account的身份,转移一些UDT
```js
async function example(){
  await service.transfer({
      asset_id: assetId,
      to,
      value: 520
    });
  //这个方法没有方法返回
}
```

### util
请参考api文档
