import arweave, { getWalletKey } from "./arweave";
import sha256 from "crypto-js/sha256";
import {
  WagmiEIP712TypedMessage,
  EIP712TypedMessage,
  FormInput,
  FormSubmissionInput
} from "types";
import { packToSolidityProof } from "@semaphore-protocol/proof";
import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
import { poseidon } from "circomlibjs"; // v0.0.8

import {
  MessageTypes,
  recoverTypedSignature,
  SignTypedDataVersion
} from "@metamask/eth-sig-util";
import storyForm from "../lib/story-form";
import { getBundlr } from "./bundlr";

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
  // If the form is a gated form:
  /*
  const groupId = 0; // Get group id of form from Arweave
  const address = ""; // Get address from the signature

  const events = await storyForm.queryFilter(
    storyForm.filters.MemberAdded(groupId, null, null)
  );

  const members = events.map(({ args }) => args[1].toString());
  const tree = new IncrementalMerkleTree(poseidon, 16, BigInt(0), 2); // Binary tree.

  members.forEach(member => {
    tree.insert(member);
  });

  const hash = sha256("some message");

  const { leaf, pathIndices, siblings } = tree.createProof(1);

  // addMember
  // Wait for the transaction to complete

  await storyForm.verifyMerkleProof(
    groupId,
    leaf,
    siblings,
    pathIndices,
    hash,
    signature
  );
  */

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
  console.log(transaction.id);

  //  await arweave.transactions.post(transaction);

  if (formSubmission.dataSubmissionProof) {
    const dataSubmissionProof = JSON.parse(formSubmission.dataSubmissionProof);
    const membershipProof = JSON.parse(formSubmission.membershipProof);
    debugger;
    const solidityDataSubmissionProof = packToSolidityProof(
      dataSubmissionProof.proof
    );

    const solidityMembershipProof = packToSolidityProof(membershipProof.proof);

    const verificationTx = await storyForm.verifyProof(
      dataSubmissionProof.publicSignals[0],
      membershipProof.publicSignals.externalNullifier,
      dataSubmissionProof.publicSignals[1],
      membershipProof.publicSignals.nullifierHash,
      solidityMembershipProof,
      solidityDataSubmissionProof,
      {
        gasLimit: 1000000
      }
    );

    return {
      arweaveTxId: transaction.id,
      verificationTxId: verificationTx.txId
    };
  }
  return {
    arweaveTxId: transaction.id
  };
};
