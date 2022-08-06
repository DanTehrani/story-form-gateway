import arweave, { getWalletKey } from "./arweave";
import sha256 from "crypto-js/sha256";
import { APP_ID, APP_VERSION } from "../config";
import {
  EIP721TypedMessage,
  FormInput,
  Answer,
  FormSubmissionInput
} from "types";
import { packToSolidityProof } from "@semaphore-protocol/proof";
import { ethers } from "ethers";
import { STORY_FORM_CONTRACT } from "../config";
import { wallet, provider } from "./ethereum";

import {
  MessageTypes,
  recoverTypedSignature,
  SignTypedDataVersion
} from "@metamask/eth-sig-util";
import StoryFormABI from "../../abi/StoryForm.json";

const isSignatureValid = (
  message: EIP721TypedMessage,
  signature: string,
  address: string
): boolean => {
  try {
    const recoveredAddr = recoverTypedSignature<
      SignTypedDataVersion.V4,
      MessageTypes
    >({
      data: message,
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
  const formId = sha256(form.owner + Date.now());

  /*
  if (!isSignatureValid(form, signature, form.owner)) {
    throw new Error("Invalid signature");
  }
  */

  const key = await getWalletKey();

  const transaction = await arweave.createTransaction(
    {
      data: JSON.stringify(form, null, 0)
    },
    key
  );

  transaction.addTag("App-Id", APP_ID);
  transaction.addTag("App-Version", APP_VERSION);
  transaction.addTag("Type", "Form");
  transaction.addTag("Form-Id", formId);
  transaction.addTag("Signature", signature); // sign(version, title, questions)
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
  verificationTxId: string;
}> => {
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

  transaction.addTag("App-Id", APP_ID);
  transaction.addTag("App-Version", APP_VERSION);
  transaction.addTag("Type", "submission");
  transaction.addTag("Form-Id", formSubmission.formId);
  transaction.addTag("Submission-Id", formSubmission.submissionId);
  transaction.addTag("Unix-Time", formSubmission.unixTime.toString());

  await arweave.transactions.sign(transaction, key);
  await arweave.transactions.post(transaction);

  const dataSubmissionProof = JSON.parse(formSubmission.dataSubmissionProof);
  const membershipProof = JSON.parse(formSubmission.membershipProof);

  const solidityDataSubmissionProof = packToSolidityProof(
    dataSubmissionProof.proof
  );

  const solidityMembershipProof = packToSolidityProof(membershipProof.proof);

  const storyForm = new ethers.Contract(
    STORY_FORM_CONTRACT,
    StoryFormABI.abi,
    provider
  );

  let contractWithSigner = storyForm.connect(wallet);

  const verificationTx = await contractWithSigner.verifyProof(
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

  await verificationTx.wait();

  return {
    arweaveTxId: transaction.id,
    verificationTxId: verificationTx.txId
  };
};
