import { convertNumberToHex, convertUtf8ToNumber } from "@walletconnect/utils";
import {
  convertAmountToRawNumber,
  multiply,
  add,
  smallerThan
} from "../helpers/bignumber";
import {
  apiGetAccountNonce,
  apiGetGasPrices,
  apiGetAccountBalance,
  apiGetTokenBalance
} from "../helpers/api";
import {
  getDataString,
  removeHexPrefix,
  sanitizeHex
} from "../helpers/utilities";
import FUNCTIONS from "../constants/functions";
import SUPPORTED_ASSETS from "../constants/supportedAssets";

export function getAsset(symbol: string, chainId: number) {
  let result = null;
  if (SUPPORTED_ASSETS[chainId]) {
    result = SUPPORTED_ASSETS[chainId][symbol] || null;
  }
  return result;
}

export function getSupportedTokens(chainId: number) {
  let result: string[] = [];
  const assetList = SUPPORTED_ASSETS[chainId];
  if (assetList) {
    const assetSymbols = Object.keys(assetList);
    result = assetSymbols.filter(symbol => isToken(assetList[symbol]));
  }
  return result;
}

export function isToken(asset: any) {
  return !!asset.contractAddress;
}

export async function formatTransaction(
  from: string,
  to: string,
  amount: string,
  symbol: string,
  chainId: number
) {
  const supportedTokens = getSupportedTokens(chainId);
  const asset = getAsset(symbol, chainId);

  if (!asset) {
    throw new Error(`Currency ${symbol} not supported!`);
  }

  let value = "";
  let data = "";
  let gasLimit = 0;

  amount = convertAmountToRawNumber(amount);
  console.log("[formatTransaction] amount", amount); // tslint:disable-line

  const nonce = await apiGetAccountNonce(from, chainId);

  console.log("[formatTransaction] nonce", nonce); // tslint:disable-line

  const gasPrices = await apiGetGasPrices();
  const gasPrice = convertUtf8ToNumber(
    convertAmountToRawNumber(gasPrices.average.price, 9)
  );

  console.log("[formatTransaction] gasPrice", gasPrice); // tslint:disable-line

  const eth = await apiGetAccountBalance(from, chainId);

  console.log("[formatTransaction] eth.balance", eth.balance); // tslint:disable-line
  if (!isToken(asset)) {
    value = amount;
    data = "0x";
    gasLimit = 21000;
    const gasTotal = multiply(gasPrice, gasLimit);
    console.log("[formatTransaction] gasTotal", gasTotal); // tslint:disable-line
    const total = add(amount, gasTotal);
    console.log("[formatTransaction] total", total); // tslint:disable-line
    // tslint:disable-next-line
    console.log(
      `[formatTransaction] smallerThan(eth.balance || "0", total)`,
      smallerThan(eth.balance || "0", total)
    );

    if (smallerThan(eth.balance || "0", total)) {
      throw new Error(`ETH balance is not enough`);
    }
  } else if (supportedTokens.includes(asset.symbol)) {
    const dai = await apiGetTokenBalance(from, asset.contractAddress, chainId);
    console.log("[formatTransaction] dai.balance", dai.balance); // tslint:disable-line
    value = "0x00";
    data = getDataString(FUNCTIONS.TOKEN_TRANSFER, [
      removeHexPrefix(to),
      removeHexPrefix(convertNumberToHex(amount))
    ]);
    gasLimit = 40000;
    to = asset.contractAddress;
    const gasTotal = multiply(gasPrice, gasLimit);
    console.log("[formatTransaction] gasTotal", gasTotal); // tslint:disable-line
    // tslint:disable-next-line
    console.log(
      `[formatTransaction] smallerThan(dai.balance || "0", amount)`,
      smallerThan(dai.balance || "0", amount)
    );
    // tslint:disable-next-line
    console.log(
      `[formatTransaction] smallerThan(eth.balance || "0", gasTotal)`,
      smallerThan(eth.balance || "0", gasTotal)
    );

    if (smallerThan(dai.balance || "0", amount)) {
      throw new Error(`${asset.symbol} balance is not enough`);
    } else if (smallerThan(eth.balance || "0", gasTotal)) {
      throw new Error(`Not enough ETH to cover gas costs`);
    }
  } else {
    throw new Error(`Currency ${asset.symbol} not supported!`);
  }

  const tx = {
    from: sanitizeHex(from),
    to: sanitizeHex(to),
    nonce: nonce ? convertNumberToHex(nonce) : "",
    gasPrice: gasPrice ? convertNumberToHex(gasPrice) : "",
    gasLimit: gasLimit ? convertNumberToHex(gasLimit) : "",
    value: value ? convertNumberToHex(value) : "",
    data: data || "0x"
  };

  console.log("[formatTransaction] tx", tx); // tslint:disable-line

  return tx;
}
