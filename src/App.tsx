import * as React from "react";
import styled from "styled-components";
import Web3 from "web3";
import Web3Connect from "web3connect";
import Column from "./components/Column";
import Wrapper from "./components/Wrapper";
import Header from "./components/Header";
import Loader from "./components/Loader";
import {
  queryChainId,
  appendToQueryString,
  parseQueryString
} from "./helpers/utilities";
import { formatTransaction } from "./helpers/transaction";

const SLayout = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  text-align: center;
`;

const SContent = styled(Wrapper)`
  width: 100%;
  height: 100%;
  padding: 0 16px;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SLanding = styled(Column)`
  height: 600px;
`;

const SBalances = styled(SLanding)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;

interface IPaymentRequest {
  currency: string;
  amount: string;
  to: string;
  callbackUrl: string;
}

interface IAppState {
  fetching: boolean;
  address: string;
  web3: any;
  connected: boolean;
  chainId: number;
  networkId: number;
  paymentRequest: IPaymentRequest | null;
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  address: "",
  web3: null,
  connected: false,
  chainId: 1,
  networkId: 1,
  paymentRequest: null
};

let accountInterval: any = null;

function loadPaymentRequest() {
  let result = null;
  if (typeof window !== "undefined") {
    const queryString = window.location.search;
    if (queryString && queryString.trim()) {
      const queryParams = parseQueryString(queryString);
      if (Object.keys(queryParams).length) {
        if (!queryParams.currency) {
          console.error("No Currency Value Provided"); // tslint:disable-line
        } else if (!queryParams.amount) {
          console.error("No Amount Value Provided"); // tslint:disable-line
        } else if (!queryParams.to) {
          console.error("No Address Value Provided"); // tslint:disable-line
        } else if (!queryParams.callbackUrl) {
          console.error("No Callback Url Provided"); // tslint:disable-line
        } else {
          result = {
            currency: queryParams.currency,
            amount: queryParams.amount,
            to: queryParams.to,
            callbackUrl: decodeURIComponent(queryParams.callbackUrl)
          };
        }
      }
    }
  }
  return result;
}

class App extends React.Component<any, any> {
  public state: IAppState = {
    ...INITIAL_STATE,
    paymentRequest: loadPaymentRequest()
  };

  public onConnect = async (provider: any) => {
    const web3 = new Web3(provider);

    const accounts = await web3.eth.getAccounts();

    const chainId = await queryChainId(web3);

    accountInterval = setInterval(() => this.checkCurrentAccount(), 100);

    await this.setState({
      web3,
      connected: true,
      address: accounts[0],
      chainId
      // networkId
    });

    await this.requestTransaction();
  };

  public requestTransaction = async () => {
    console.log("[requestTransaction]"); // tslint:disable-line
    const { address, paymentRequest, web3 } = this.state;
    if (paymentRequest) {
      const { currency, amount, to, callbackUrl } = paymentRequest;
      const from = address;
      const tx = await formatTransaction(from, to, amount, currency);
      console.log("[requestTransaction] tx", tx); // tslint:disable-line
      try {
        const txHash = await web3.eth.sendTransaction(tx);
        console.log("[requestTransaction] txHash", txHash); // tslint:disable-line
        if (typeof window !== "undefined") {
          window.open(appendToQueryString(callbackUrl, { txHash }));
        } else {
          console.error("Window is undefined"); // tslint:disable-line
        }
      } catch (error) {
        console.error(error); // tslint:disable-line
      }
    } else {
      console.error("Payment request missing or invalid"); // tslint:disable-line
    }
  };

  public openCallbackUrl(txHash: string) {
    if (typeof window !== "undefined") {
      window.open();
    }
  }

  public checkCurrentAccount = async () => {
    const { web3, address, chainId } = this.state;
    if (!web3) {
      return;
    }
    const accounts = await web3.eth.getAccounts();
    if (accounts[0] !== address) {
      this.onSessionUpdate(accounts, chainId);
    }
  };

  public onSessionUpdate = async (accounts: string[], chainId: number) => {
    const address = accounts[0];
    await this.setState({ chainId, accounts, address });
  };

  public resetApp = async () => {
    const { web3 } = this.state;
    if (
      web3 &&
      web3.currentProvider &&
      web3.currentProvider.connection &&
      web3.currentProvider.connection.isWalletConnect
    ) {
      await web3.currentProvider.connection._walletConnector.killSession();
    }
    clearInterval(accountInterval);
    this.setState({ ...INITIAL_STATE });
  };

  public render = () => {
    const {
      fetching,
      connected,
      address,
      chainId,
      paymentRequest
    } = this.state;
    return (
      <SLayout>
        <Column maxWidth={1000} spanHeight>
          <Header
            connected={connected}
            address={address}
            chainId={chainId}
            killSession={this.resetApp}
          />
          <SContent>
            {fetching ? (
              <Column center>
                <SContainer>
                  <Loader />
                </SContainer>
              </Column>
            ) : !paymentRequest ? (
              <SBalances>
                <h3>Failed</h3>
                <p>{`Payment request not supported or invalid`}</p>
              </SBalances>
            ) : (
              <SLanding center>
                <h3>{`Payment Request`}</h3>

                <p>{`Paying ${paymentRequest.amount} ${paymentRequest.currency}`}</p>
                {!connected ? (
                  <Web3Connect.Button
                    label="Pay"
                    providerOptions={{
                      portis: {
                        id: process.env.REACT_APP_PORTIS_ID,
                        network: "mainnet"
                      },
                      fortmatic: {
                        key: process.env.REACT_APP_FORTMATIC_KEY
                      }
                    }}
                    onConnect={(provider: any) => this.onConnect(provider)}
                  />
                ) : (
                  <p>{`Awaiting payment`}</p>
                )}
              </SLanding>
            )}
          </SContent>
        </Column>
      </SLayout>
    );
  };
}

export default App;
