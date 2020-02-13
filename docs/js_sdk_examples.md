# JS-SDK examples

- [JS-SDK examples](#JS-SDK)
  - [Ex1, 如何构建一个Muta对象,用以和链开始交互](#Muta)
  - [Ex2, 创建分层确定性HD钱包,来管理你的账户](#HDWallet)
  - [Ex3, 创建一个Account,来管理账户的公私钥对](#Account)
  - [Ex4, 构建Client对象,正式和链上的Service进行数据交互](#Client)
  - [Ex5, 通过使用AssetService API,直接和AssetService交互](#AssetService)
  
## Muta

首先,我们先通过一个例子来了解Muta类
在使用Muta类之前,请安装muta-sdk
```bash
npm install muta-sdk
```

现在我们来创建一个Muta对象:
```js
const muta = new Muta({
    /**
     *  假设0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036是你要访问的Muta链的ChainId
     *  这通常也是在genesis.toml里包含的默认的chain_id
     */
    chainId:
      '0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036',

    /**
     *  接下来我们给出GraphQL API uri. endpoint是用来和链进行rpc交互的uri,
     *  http://127.0.0.1:8000/graphql是默认的endpoint是用来和链进行rpc交互的uri,
     *  你可以在config.toml文件下的[graphql]部分找到endpoint的配置
     */
    endpoint: 'http://127.0.0.1:8000/graphql',

    /**
     * timeout_gap表示在Muta链中,一笔交易要经过多少个块被mined才算有效,如果随着链的进行,block超出了
     * timeout_gap的设置但是交易仍然没有被mined,那么这笔交易就被认为无效了.
     * 比起以太坊的txpool的不确定性,Muta链提供了tx及时性的检测和保障.
     * 在Muta链中, timeoutGap并没有默认值,但是js-sdk预设为20,你可以所以更改
     */
    timeoutGap: DEFAULT_TIMEOUT_GAP,
  });
```

当然,如果是为了跑通例子,那么接下来会更方便
```js
  /**
   * 因为测试链的参数基本一致,所以上面的参数一般不会修改,那么下面的语句和上面的逻辑是一样的
   */
  const mutaByDefaultConfig = Muta.createDefaultMutaInstance();
```

好的,你已经了解了Muta类了,非常简单,接下来让我们看看分层确定性钱包吧.

## HDWallet

首先,如果你不了解HD钱包(分层确定性钱包),请先了解:
1. [bip32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki),
2. [bip39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
3. [bip44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)

OK, 那么我们先获得HDWallet的类型,注意,它只是构造函数,不是对象:
```js
  const Wallet = Muta.hdWallet;
```

使用HD钱包,通常你需要一组12个字的助记词,你可以用已有的助记词,或者通过下面的方法生成助记词,
当然,该组助记词会用来生成seed种子,然后构建HDWallet的masterNode.
```js
    const mnemonicWords = Wallet.generateMnemonic();
```

然后你可以使用助记词来构建一个HDWallet了,这里使用的是我们刚才随机生成的助记词,当然你也可以用已有的:
```js
    const hdWallet = new Wallet(mnemonicWords);
    const hdWallet = new HDWallet(
    'drastic behave exhaust enough tube judge real logic escape critic horror gold'
  )
```

仅接着,可以通过创建的HDWallet来派生子秘钥了.
根据bip44的规范,我们的派生路径被设定为:
m/44'/${COIN_TYPE}'/${accountIndex}'/0/0
其中COIN_TYPE = 918
accountIndex就是需要派生的账户的索引.

```js
    const account = hdWallet.deriveAccount(2);//我们派生accountIndex=2的账户
```

现在我们继续往账户这个概念上走.

## Account

Account账户是非常简单的类型,和其他大多数区块链一样,一个地址唯一标识了一个区块链上的账户. Muta-chain也是如此,
Account包含了一对公私钥对,以及他派生出来的地址. Muta-chain使用secp256k1作为签名曲线.

上面的HDWallet可以派生出账户:
```js
    const account = hdWallet.deriveAccount(2);//我们派生accountIndex=2的账户
```

当然,如果你有自己私钥,也可以通过指定私钥创建Account
```js
    const account = Account.fromPrivateKey(
        '0x1000000000000000000000000000000000000000000000000000000000000000',
      );
```

当然,获得对应的公钥和地址不在话下
``js
    const publicKey = account.publicKey;
    const address = account.address;
``

好的,你已经了解的很多了,现在我们进入Client,来学习如何和Muta-chain进行交互

## Client

Client类屏蔽了GraphQL的细节,帮助开发者更方便地和链做GraphQL API交互.

如果想了解什么是GraphQL,请参考 https://graphql.org/
如果想了解Muta-chain的GraphQL API接口, 请参看 接口 章节

GraphQL将请求分类为2类:Query和Mutation.前者不会对数据进行任何形式的修改,是查.后者则相反,增珊改都可能发生.
Muta-chain GraphQL API接口也是如此.

此外,Client类还提供了一些工具方法,这些方法不会发送请求到网络,所以他们不属于Muta-chain GraphQL API接口,
但是也被包含在Client类里.

所以,目前的API大致分为如下
**Query**
1. getBlock, getLatestBlockHeight and waitForNextNBlock
2. getTransaction
3. getReceipt
4. queryService] and queryServiceDyn

**Mutation**
1. sendTransaction

**Locally**
1. composeTransaction

我们通过例子,一步一步来了解

因为Client必须知道通过那个接口和节点进行数据通信,所以必须提供uri. 不过我们已经在构建Muta对象时,给出了endpoint参数,
那么我们可以直接通过Muta对象来获得一个Client对象
```js
  let client = Muta.createDefaultMutaInstance().client();
```

当然,你也可以自己构建一个Client对象:

其中的参数类型为:
```typescript
type Uint64 = string
export interface ClientOption {
  endpoint: string;
  chainId: string;
  maxTimeout: number;
  defaultCyclesLimit: Uint64;
  defaultCyclesPrice: Uint64;
}
```
你已经了解了endpoint,chainId. CyclesLimit和CyclesPrice的概念类似于以太坊的gasLimit和gasPrice.
defaultCyclesLimit和defaultCyclesPrice是在将来发送GraphQL API请求时给定的默认值,当然你在发送请求的时候随时指定新的值.

maxTimeout = DEFAULT_TIMEOUT_GAP * DEFAULT_CONSENSUS_INTERVAL.
你已经了解了DEFAULT_TIMEOUT_GAP.因为区块链没有世界时钟,所以只能通过block高度x平均期望出块时间来大致计算出现实时间.
Muta-chain内置Overlord共识算法的**预期****单轮**出块时间是3秒,所以DEFAULT_CONSENSUS_INTERVAL=3

```js
  /**
   * or if you want to initialize a customized Client object, you could pass a ClientOption arg
   *
   * export interface ClientOption {
   *  endpoint: string; // you already know it
   *  chainId: string; //the Muta chain id, refer to >>genesis.toml<<
   *  maxTimeout: number; //this is the timeoutGap, please see ex1
   *  defaultCyclesLimit: Uint64; //below
   *  defaultCyclesPrice: Uint64; //below
   * }
   *
   * the client may send transactions to the Muta chain, like most block chains,
   * to prevent infinite loop and turing-complete machine, the defaultCyclesLimit
   * and defaultCyclesPrice will pass to the specific GraphQL APIs when you doesn't
   * specify one explicitly
   *
   * maxTimeout is set to DEFAULT_TIMEOUT_GAP * DEFAULT_CONSENSUS_INTERVAL,
   * we explained DEFAULT_TIMEOUT_GAP in ex1
   * DEFAULT_CONSENSUS_INTERVAL is the default block time to Muta consensus, which is Overlord.
   * you can set maxTimeout to what you want, of course a number :)
   */

  let client = new Client({
    chainId:
      '0xb6a4d7da21443f5e816e8700eea87610e6d769657d6b8ec73028457bf2ca4036',
    defaultCyclesLimit: '0xffff',
    defaultCyclesPrice: '0xffff',
    endpoint: 'http://127.0.0.1:8000/graphql',
    maxTimeout: DEFAULT_TIMEOUT_GAP * DEFAULT_CONSENSUS_INTERVAL,
  });
```
接下来万事俱备,我们开始与链进行交互

我们先尝试获得某个区块的信息,因为如果你能某一个区块的信息,就能获得所有的区块的信息,就能获得区块链的信息.

我们获得第10高度的区块:
```js
  const blockInfo = await client.getBlock('10');
```
也可以获得最新的高度的区块:
```js
  const latestBlockInfo = await client.getBlock(null);
```

当然,你可以直接获得最新区块的高度:
```js
  let latestBlockHeight = hexToNum(latestBlockInfo.header.height);
  // or more easy way
  latestBlockHeight = await client.getLatestBlockHeight();
```

接下来我们更进一步,我们从节点Query一些数据,还记得么Query和Mutation的差别么?

Muta-chain有很多service,例如metadata服务会提供一些关于链的基础信息,asset资产服务可以提供创建用户自定义token的功能(User defined tokens).

服务也能大致分为2类,一类是Muta-chain built-in服务(内置服务),另一类是user-defined服务(用户自定义服务)服务之间通常居然有依赖关系,可以互相调用,构建出更高级的业务逻辑.

设想一下,你的业务逻辑由很多个小的模块组成.或者你的服务由很多个微服务组成.各个模块或者微服务,组合起来,构成了你需要的
业务逻辑.

**Muta-chain也是如此,每个service都是最小的功能单元,组合他们,构成了你的业务逻辑,也就是业务区块链!这也是Muta-chain想要带给用户的体验.**

在发起任何Query之前,我们都必须知道请求接口交互的数据格式是什么.

如果你是要个内置服务交互,那么请参考我们的内置服务的GraphQL API 接口手册,如果你是要和用户自定义服务交互,那么请咨询服务的开发团队.

为了进一步学习,我们现在向AssetService来发起Query请求,访问数据.
假设我们要向AssetService来发起查询Asset的请求.那么查看GraphQL API 接口手册,我们需要的给出的数据类型是:
```typescript
type Hash = string;
export interface GetAssetParam {
  asset_id: Hash;
}
```
接口返回的数据类型是:
```typescript
type Hash = string;
type Address = string;
export interface Asset {
  asset_id: Hash;
  name: string;
  symbol: string;
  supply: number | BigNumber;
  issuer: Address;
}
```

其中asset_id是创建一个Asset后,Asset服务返回的唯一标识.name和symbol是用户自定义的标识,supply是总量,issuer是创建账户.这和以太坊的ERC20非常相似


现在我们通过queryServiceDyn方法来访问他,queryServiceDyn和queryService的api,请参考sdk文档或者api doc:

```typescript
  let asset : Asset | null = null;
  try {
    const asset_id =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    asset = await client.queryServiceDyn<
      GetAssetParam,
      Asset
      // tslint:disable-next-line:no-object-literal-type-assertion
    >({
      caller: '0x2000000000000000000000000000000000000000',
      method: 'get_balance',
      payload: { asset_id },
      serviceName: 'asset',
    } as ServicePayload<GetAssetParam>);
  } catch (e) {
    asset = null;
  }
```

很好,这段代码应该会进入catch,然后设定asset为null,毕竟我们什么Asset都没有创建过.这仅仅是一个Query,查询的例子.

现在我们进入增删改的部分,也就是Mutation请求. SendTransaction是一个Mutation的请求.那么我们来看看SendTransaction需要提供那些数据.

```typescript
    public async sendTransaction(
    signedTransaction: SignedTransaction,
  ): Promise<Hash> 

    export interface SignedTransaction {
      chainId: string;
      cyclesLimit: string;
      cyclesPrice: string;
      nonce: string;
      timeout: string;
      serviceName: string;
      method: string;
      payload: string;
      txHash: string;
      pubkey: string;
      signature: string;
    }
```
可以看到,发送一笔交易,和大多数区块链类似,需要一笔被**签名**的交易.


那么我们先来构建一笔**创建**Asset交易,然后对其签名.

通过查询GrapQL API 接口文档,

 - 创建Asset服务的服务名是: asset

 - 接口的方法为: create_asset,
 
 - 接受接受的参数为: CreateAssetParam

```typescript
    export interface CreateAssetParam {
      name: string;
      symbol: string;
      supply: number | BigNumber;
    }
```

那么我们通过Client的工具方法composeTransaction来构建一个这样的签名:

```typescript
    const tx = await client.composeTransaction<CreateAssetParam>({
        method: 'create_asset',
        payload: createAssetParam,
        serviceName: 'asset',
      });
```

随后我们需要使用一个用户,对其签名,那么这个用户就是这个Asst的issuer. 还记得Account类型么?现在是他上场的时候了,使用你所期望的用户的Account对象调用signTransaction来对对交易签名:

```typescript
    const signedTransaction = Account.fromPrivateKey(
        '0x1000000000000000000000000000000000000000000000000000000000000000',
      ).signTransaction(tx);
```

现在我们可以调用signTransaction来发送我们的交易了. 和大多数区块链一样,由于是异步网络和起步业务系统,你所提交的交易可能不会被立刻提交到区块链上.若依节点通常返回交易的位置标识哈希值.

```typescript
    const txHash = await client.sendTransaction(this.account.signTransaction(tx));
```

接下来我们只需要定期去查询交易,看交易是否被成功提交到了区块链.如果一笔交易被成功地提交到了区块链,那么他将不可篡改不可回滚.

当区块链认为一笔交易比成功的提交了,他会返回一张Receipt交易凭证,给出了交易的诸多信息,以及交易执行后的返回,我们通过getReceipt来获得凭证

```typescript
  const receipt: Receipt = await this.client.getReceipt(utils.toHex(txHash));

```

Receipt凭证的数据类型如下:

```typescript
export interface Receipt {
  stateRoot: string; //交易被提交后的state的root
  height: string; //交易被提交进入的块的盖高度
  txHash: string; //该笔交易的唯一哈希表示
  cyclesUsed: string; //该笔交易使用的cycle
  events: Event[]; //该笔交易产生的事件
  response: ReceiptResponse; //该笔交易的返回
}

export interface ReceiptResponse {
  serviceName: string; //该笔交易调用的服务名称
  method: string; //该笔交易调用的服务方法
  ret: string; //服务给出的返回数据
  isError: boolean; //服务给出的返回结果,运行是否成功
}
```

请仔细阅读上面的数据结构,需要只出的事,ret和isError可能同时给出.例如ret给出错误信息.返回ret数据是通用的字符串类型,但具体数据可是请参考对应服务的GraphQL API接口.

这里我们的create_asset方法返回的格式就是之前见过的Asset数据格式,并且是通过JSON来序列化的:

```typescript
export interface Asset {
  asset_id: Hash;
  name: string;
  symbol: string;
  supply: number | BigNumber;
  issuer: Address;
}
```

所以我们可以通过JSON.parse来把ret字符串转换成对应的Asset对象:

```typescript
  let createdAssetResult = utils.safeParseJSON(receipt.response.ret);//util工具类请参考API doc
```

## AssetService

好的,通过Client的例子,你已经可以向任何服务发起数据交互了,但是每次都调用原生的GraphQL API,非常的恼人,我相信你肯定可以把他们包装成对应的js方法.

现在我们来看一看内置的AssetService对应的js-sdk:

老规矩,我们仍然需要一个Client对象和Account对象,就像上一节里我们用到的一样,作用也是一样的.随后我们创建一个AssetService
```typescript
    const muta = Muta.createDefaultMutaInstance();
      const account = Account.fromPrivateKey(
        '0x1000000000000000000000000000000000000000000000000000000000000000',
      );
    
      /**
       * we build a service, pass the client and account object
       * nothing abnormal
       */
      const service = new AssetService(muta.client(), account);
```

接下来就非常简单了,我们直接创建一个资产,参数类型和之前的相同,不再赘述:
```typescript
    const createdAsset = await service.create_asset({
      name: 'LOVE_COIN',
      supply,
      symbol: 'LUV',
    });
     const assetId = createdAsset.response.ret.id;
```

查询一下某个用户的余额:
```typescript
    const {
        ret: { balance : balance0x2000000000000000000000000000000000000000},
      }= await service.get_balance({
          asset_id : assetId,
          user : to,
      });
```

最后是向某个用户发送一定数量的UDT,这里是LOVE_COIN
```typescript
  await service.transfer({
    asset_id: assetId,
    to:'0x2000000000000000000000000000000000000000',
    value: 520,
  });
```

好了,所有的教程都结束了,你已经十分了解Muta-chain了
