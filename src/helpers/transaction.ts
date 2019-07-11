import { convertNumberToHex, convertUtf8ToNumber } from "@walletconnect/utils";
import { convertAmountToRawNumber } from "../helpers/bignumber";
import { apiGetAccountNonce, apiGetGasPrices } from "../helpers/api";
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
  let value = "";
  let data = "";
  let gasLimit = 0;

  amount = convertAmountToRawNumber(amount);

  if (currency && currency.toUpperCase() === "ETH") {
    value = amount;
    data = "0x";
    gasLimit = 21000;
  } else if (currency && currency.toUpperCase() === "DAI") {
    const tokenAddress = DAI_TOKEN_ADDRESS;
    value = "0x00";
    data = getDataString(TOKEN_TRANSFER, [
      removeHexPrefix(to),
      removeHexPrefix(convertNumberToHex(amount))
    ]);
    gasLimit = 40000;
    to = tokenAddress;
  } else {
    throw new Error(`Currency ${currency} not supported!`);
  }

  const nonce = await apiGetAccountNonce(from, 1);

  const gasPrices = await apiGetGasPrices();
  const gasPrice = convertUtf8ToNumber(
    convertAmountToRawNumber(gasPrices.average.price, 9)
  );
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
