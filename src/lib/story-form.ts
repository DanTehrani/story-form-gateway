import { wallet, provider } from "./ethereum";
import { STORY_FORM_CONTRACT_ADDRESS } from "../config";
import { ethers } from "ethers";
import StoryFormABI from "../../abi/StoryForm.json";

const storyForm = new ethers.Contract(
  STORY_FORM_CONTRACT_ADDRESS[process.env.ETHEREUM_NETWORK],
  StoryFormABI.abi,
  provider
);

const storyFormWithSigner = storyForm.connect(wallet);

export default storyFormWithSigner;
