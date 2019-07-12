import * as React from "react";
import styled from "styled-components";
import Loader from "../components/Loader";
import { IPayment } from "../helpers/types";
import {
  PAYMENT_SUCCESS,
  PAYMENT_PENDING,
  PAYMENT_FAILURE
} from "../constants/paymentStatus";
import success from "../assets/success.png";
import error from "../assets/error.png";
import { colors, fonts } from "../styles";

const SCheckoutCallToAction = styled.div`
  font-size: ${fonts.size.medium};
  text-align: center;
  margin: 0.6em 0;
  font-size: 24px;
  font-weight: 700;
`;

const SCheckoutDescription = styled.div`
  font-size: ${fonts.size.small};
  color: rgb(${colors.grey45});
  margin-top: 4px;
  text-align: center;
`;

const SCheckoutColumn = styled.div`
  width: 100%;
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
`;

const QRCODE_HEIGHT = 300;

interface IPaymentResultStyleProps {
  height: number;
}

const SPaymentResult = styled.div<IPaymentResultStyleProps>`
  width: 100%;
  height: 100%;
  max-height: ${({ height }) => `${height}px`};
  padding-top: ${({ height }) => `${height}px`};
  position: relative;

  & > div {
    position: absolute;
    width: 100%;
    height: 100%;
    max-height: ${QRCODE_HEIGHT}px;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  & > div > img {
    width: 125px;
    height: 125px;
  }
`;

const PAYMENT_COPY = {
  [PAYMENT_SUCCESS]: {
    title: "Success",
    description: `Your payment went through and you will redirected in a few seconds.`
  },
  [PAYMENT_PENDING]: {
    title: "Payment Pending",
    description: `We are waiting for your transaction to be signed from your wallet.`
  },
  [PAYMENT_FAILURE]: {
    title: "Payment Failed",
    description: `Please check your wallet for any transaction error information.`
  }
};

interface IPaymentResultProps extends IPaymentResultStyleProps {
  payment: IPayment;
}

const PaymentResult = (props: IPaymentResultProps) => {
  switch (props.payment.status) {
    case PAYMENT_SUCCESS:
      return (
        <SCheckoutColumn>
          <SPaymentResult height={props.height}>
            <div>
              <img src={success} alt={PAYMENT_COPY[PAYMENT_SUCCESS].title} />
            </div>
          </SPaymentResult>
          <SCheckoutCallToAction>
            {PAYMENT_COPY[PAYMENT_SUCCESS].title}
          </SCheckoutCallToAction>
          <SCheckoutDescription>
            {PAYMENT_COPY[PAYMENT_SUCCESS].description}
          </SCheckoutDescription>
        </SCheckoutColumn>
      );
    case PAYMENT_PENDING:
      return (
        <SCheckoutColumn>
          <SPaymentResult height={props.height}>
            <div>
              <Loader />
            </div>
          </SPaymentResult>
          <SCheckoutCallToAction>
            {PAYMENT_COPY[PAYMENT_PENDING].title}
          </SCheckoutCallToAction>
          <SCheckoutDescription>
            {PAYMENT_COPY[PAYMENT_PENDING].description}
          </SCheckoutDescription>
        </SCheckoutColumn>
      );

    case PAYMENT_FAILURE:
      return (
        <SCheckoutColumn>
          <SPaymentResult height={props.height}>
            <div>
              <img src={error} alt={PAYMENT_COPY[PAYMENT_FAILURE].title} />
            </div>
          </SPaymentResult>
          <SCheckoutCallToAction>
            {PAYMENT_COPY[PAYMENT_FAILURE].title}
          </SCheckoutCallToAction>
          <SCheckoutDescription>
            {PAYMENT_COPY[PAYMENT_FAILURE].description}
          </SCheckoutDescription>
        </SCheckoutColumn>
      );
    default:
      return null;
  }
};

export default PaymentResult;
