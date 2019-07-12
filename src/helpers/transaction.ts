import { convertNumberToHex, convertUtf8ToNumber } from "@walletconnect/utils";
import {
  convertAmountToRawNumber,
  multiply,
  add,
  greaterThanOrEqual,
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

const TOKEN_TRANSFER = "0xa9059cbb";
const DAI_TOKEN_ADDRESS = "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359";

export async function formatTransaction(
  from: string,
  to: string,
  amount: string,
  currency: string
) {
  const chainId = 1;

  let value = "";
  let data = "";
  let gasLimit = 0;

  amount = convertAmountToRawNumber(amount);

  const nonce = await apiGetAccountNonce(from, chainId);

  const gasPrices = await apiGetGasPrices();
  const gasPrice = convertUtf8ToNumber(
    convertAmountToRawNumber(gasPrices.average.price, 9)
  );

  const eth = await apiGetAccountBalance(from, chainId);
  if (currency && currency.toUpperCase() === "ETH") {
    value = amount;
    data = "0x";
    gasLimit = 21000;
    const gasTotal = multiply(gasPrice, gasLimit);
    const total = add(amount, gasTotal);
    if (smallerThan(eth.balance || "0", total)) {
      throw new Error("ETH balance is not enough");
    }
  } else if (currency && currency.toUpperCase() === "DAI") {
    const tokenAddress = DAI_TOKEN_ADDRESS;
    const dai = await apiGetTokenBalance(from, tokenAddress, chainId);
    value = "0x00";
    data = getDataString(TOKEN_TRANSFER, [
      removeHexPrefix(to),
      removeHexPrefix(convertNumberToHex(amount))
    ]);
    gasLimit = 40000;
    to = tokenAddress;
    const gasTotal = multiply(gasPrice, gasLimit);
    if (smallerThan(dai.balance || "0", amount)) {
      throw new Error("DAI balance is not enough");
    } else if (smallerThan(eth.balance || "0", gasTotal)) {
      throw new Error("Not enough ETH to cover gas costs");
    }
  } else {
    throw new Error(`Currency ${currency} not supported!`);
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

  return tx;
}
