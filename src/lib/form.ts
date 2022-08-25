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

  // TODO Don't allow uploading in dev environment

  const key = await getWalletKey();

  const transaction = await arweave.createTransaction(
    {
      data: JSON.stringify(form, null, 0)
    },
    key
  );

  transaction.addTag("App-Id", form.appId);
  transaction.addTag("Type", "Form");
  transaction.addTag("Form-Id", formId);
  transaction.addTag("Owner", form.owner);
  transaction.addTag("Status", form.status);
  transaction.addTag("Signature", signature);
  transaction.addTag("Unix-Time", form.unixTime.toString());

  await arweave.transactions.sign(transaction, key);
  await arweave.transactions.post(transaction);

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

  const key = await getWalletKey();
  const transaction = await arweave.createTransaction(
    {
      data: JSON.stringify(
        {
          answers: formSubmission.answers,
          membershipProof: formSubmission.membershipProof,
          dataSubmissionProof: formSubmission.dataSubmissionProof
        },
        null,
        0
      )
    },
    key
  );

  transaction.addTag("App-Id", formSubmission.appId);
  transaction.addTag("Type", "Submission");
  transaction.addTag("Form-Id", formSubmission.formId);
  if (formSubmission.submissionId) {
    transaction.addTag("Submission-Id", formSubmission.submissionId);
  }
  transaction.addTag("Unix-Time", formSubmission.unixTime.toString());

  await arweave.transactions.sign(transaction, key);
  await arweave.transactions.post(transaction);

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
