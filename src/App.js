import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import {
  PhantomWalletAdapter
} from '@solana/wallet-adapter-wallets';
import {
  useWallet,
  WalletProvider,
  ConnectionProvider
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';

import * as BufferLayout from 'buffer-layout';
// import govProgKey from './prog-key.json';
import { Buffer } from 'buffer';

require('@solana/wallet-adapter-react-ui/styles.css');
const sleep = require('sleep');

// console.log(govProgId);


const wallets = [
  new PhantomWalletAdapter()
]

const publicKey = (property = "publicKey") => {
  return BufferLayout.blob(32, property);
}

const STATE_LAYOUT = BufferLayout.struct([
  BufferLayout.u8("isInitialized"),
  publicKey("seat1"),
  publicKey("subGov1"),
  publicKey("seat2"),
  publicKey("subGov2"),
]);

class StateLayout {
  isInitialized: Number;
  seat1: Uint8Array;
  subGov1: Uint8Array;
  seat2: Uint8Array;
  subGov2: Uint8Array;
}

const govProgId = new PublicKey("Ebpc5sHcfRRmKiBmgGNTRyjezrdeFFhLGUZrFxGnZ47b");
// none of this works
// console.log(govProgKey);
// const govProgId = new PublicKey(Keypair.fromSecretKey(govProgKey));
// console.log(govProgId);

// function getProgramId() {
  // return new PublicKey(
    // JSON.parse(fs.readFileSync('prog-key.json','utf8'))
  // );
// }

function App() {
  const [value,setValue] = useState(null);
  const wallet = useWallet();
  const { signTransaction } = useWallet();

  async function doMain() {
    const connection = new Connection("http://localhost:8899","confirmed");
    // const govProgId = getProgramId();
    const [ govStateAddress,govStateAddressBump ]
      = await PublicKey.findProgramAddress(
        [ Buffer.from("state_") ], govProgId);
    console.log('using state address ' + govStateAddress);
    /*
    const createStateIx = SystemProgram.createAccount({
      space: STATE_LAYOUT.span,
      lamports: await connection.getMinimumBalanceForRentExemption(
        STATE_LAYOUT.span ),
      fromPubkey: wallet.publicKey,
      newAccountPubkey: govStateAddress,
      programId: govProgId,
    });
    console.log('createStateIx');
    console.log(createStateIx);
    const tx = new Transaction().add(createStateIx);
    */
    const initIx = new TransactionInstruction({
      programId: govProgId,
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: govStateAddress, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(Uint8Array.of(0,govStateAddressBump)),
    });
    const tx = new Transaction().add(initIx);
    tx.feePayer = wallet.publicKey;
    const blockHash = await connection.getRecentBlockhash();
    tx.recentBlockhash = await blockHash.blockhash;
    const signed = await signTransaction(tx);
    const res = await connection.sendRawTransaction(signed.serialize());
    // const res = await connection.sendTransaction(tx,[wallet]);
    console.log(res);
    await sleep.sleep(2);

    const stateAccount = await connection.getAccountInfo(govStateAddress);
    console.log(stateAccount);
  }

  if (!wallet.connected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  }
  doMain();
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)
export default AppWithProvider;
