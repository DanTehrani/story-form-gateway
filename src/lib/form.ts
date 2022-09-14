import {
  WagmiEIP712TypedMessage,
  EIP712TypedMessage,
  FormInput,
  FormSubmissionInput
} from "types";

import {
  MessageTypes,
  recoverTypedSignature,
  SignTypedDataVersion
} from "@metamask/eth-sig-util";
import { getBundlr } from "./bundlr";

const ALPHA_WHITE_LIST = [
  "0x400EA6522867456E988235675b9Cb5b1Cf5b79C8",
  "0x06D35f6B8Fb9Ad47A866052b6a6C3c2DcD1C36F1"
].map((addr: string) => addr.toUpperCase());

const isSignatureValid = (
  message: WagmiEIP712TypedMessage,
  signature: string,
  address: string
): boolean => {
  try {
    const data: EIP712TypedMessage = {
      ...message,
      types: {
        ...message.types,
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" }
        ]
      },
      message: message.value
    };

    const recoveredAddr = recoverTypedSignature<
      SignTypedDataVersion.V4,
      MessageTypes
    >({
      data,
      signature,
      version: SignTypedDataVersion.V4
    });

    if (!ALPHA_WHITE_LIST.includes(recoveredAddr.toUpperCase())) {
      return false;
    }

    return recoveredAddr.toUpperCase() === address.toUpperCase();
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * Verify the signature and create an Arweave tx to upload the form
 */
export const uploadForm = async (formInput: FormInput): Promise<string> => {
  const { signature, eip712TypedMessage } = formInput;

  const form = eip712TypedMessage.value;
  const formId = form.id;

  if (!isSignatureValid(eip712TypedMessage, signature, form.owner)) {
    throw new Error("Invalid signature");
  }

  const tags = [
    {
      name: "App-Id",
      value: form.appId
    },
    {
      name: "Type",
      value: "Form"
    },
    {
      name: "Form-Id",
      value: formId
    },
    {
      name: "Owner",
      value: form.owner
    },
    {
      name: "Status",
      value: form.status
    },
    {
      name: "Signature",
      value: signature
    },
    {
      name: "Unix-Time",
      value: form.unixTime.toString()
    }
  ];

  const bundlr = await getBundlr();
  const transaction = await bundlr.createTransaction(
    JSON.stringify(form, null, 0),
    {
      tags
    }
  );

  await transaction.sign();
  await transaction.upload();
  console.log(transaction.id);

  return transaction.id;
};

export const uploadAnswer = async (
  formSubmission: FormSubmissionInput
): Promise<{
  arweaveTxId: string;
  verificationTxId?: string;
}> => {
  const data = JSON.stringify(
    {
      answers: formSubmission.answers,
      membershipProof: formSubmission.membershipProof,
      dataSubmissionProof: formSubmission.dataSubmissionProof
    },
    null,
    0
  );

  const tags = [
    {
      name: "App-Id",
      value: formSubmission.appId
    },
    {
      name: "Type",
      value: "Submission"
    },
    {
      name: "Form-Id",
      value: formSubmission.formId
    },

    {
      name: "Unix-Time",
      value: formSubmission.unixTime.toString()
    }
  ];

  if (formSubmission.submissionId) {
    tags.push({
      name: "Submission-Id",
      value: formSubmission.submissionId
    });
  }
  const bundlr = await getBundlr();
  const transaction = await bundlr.createTransaction(data, {
    tags
  });

  await transaction.sign();
  await transaction.upload();

  return {
    arweaveTxId: transaction.id
  };
};
