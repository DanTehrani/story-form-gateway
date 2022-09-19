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
  "0x06D35f6B8Fb9Ad47A866052b6a6C3c2DcD1C36F1",
  "0xBF44E0F486f17662F2C3dBA45D70DDf02875731E",
  "0x5c53414E1f15D7668c2b9EC0A92482A64845f5f6",
  "0x2cF698719aB61206334Ab380Ce7326b033409660",
  "0x3461551e8a9D68314fDD43EB81F98044DA4a1461",
  "0x1BCbF9D847a745bed5928fb67961524EF51b72d7D",
  "0x0d81e1fE8AF3Fb98275dA094c55E536966FB9976",
  "0xB39Ef9E78Ae92023E697561D76959dbFd3BB641e",
  "0xD8868daeF60fEB03842bCE70D13e3705966306E7",
  "0x701888b4E64205aa2a9F10727FA68aD71bcEdF79",
  "0xC50A9c4D28E7E5A2dd9eDFC9e0Fbf066096c9473",
  "0xC8E9Ba58eC507C6e3d05a06C74436a9693152308",
  "0xBB67D03fD1B1Ab39927ED52c845B03558B21751F",
  "0x7F2466ae8bADee7Dc0109Edd0b6Dde08C432236c",
  "0xdA38AFF9D34fF382F12a1De111A10491566B9876",
  "0x68f2f6F7B49123AB7d5A1Ad65aeb65096C3c0D9C"
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
