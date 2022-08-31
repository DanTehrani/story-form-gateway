import { Request } from "express";

export type FormQuestion = {
  label: string;
  type: string;
};

export type FormSettings = {
  respondentCriteria: string;
  encryptAnswers: boolean;
  encryptionPubKey?: string;
  erc721TokenAddress?: string;
};

export type Form = {
  id: string;
  title: string;
  description: string;
  unitTime: number;
  questions: FormQuestion[];
  settings: FormSettings;
  owner: string;
};

export type FormUploadInput = {
  id: string;
  title: string;
  unixTime: number;
  questions: FormQuestion[];
  settings: FormSettings;
  owner: string;
  status: string;
  appId: string;
};

export type WagmiEIP712TypedMessage = {
  domain: {
    [additionalProperties: string]: string;
  };
  types: {
    [additionalProperties: string]: {
      name: string;
      type: string;
    }[];
  };
  value: FormUploadInput;
  primaryType: string;
};

export type EIP712TypedMessage = {
  types: {
    EIP712Domain: {
      name: string;
      type: string;
    }[];
    [additionalProperties: string]: {
      name: string;
      type: string;
    }[];
  };
  message: FormUploadInput;
} & WagmiEIP712TypedMessage;

export type FormInput = {
  signature: string;
  eip712TypedMessage: WagmiEIP712TypedMessage;
};

export type CreateFormRequest = {
  body: FormInput;
} & Request;

export type FormSubmissionInput = {
  formId: string;
  answers: string[];
  submissionId: string;
  dataSubmissionProof: string;
  membershipProof: string;
  unixTime: number;
  appId: string;
};

export type SubmitAnswerRequest = {
  body: FormSubmissionInput;
} & Request;
