import React, { createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { useAddress, useContract, useContractWrite, useMetamask } from '@thirdweb-dev/react';

const StateContext = createContext(); 

export const StateContextProvider = ({ children }) => {
  const {contract}= useContract('0xEfEA2171Ec6465677e9064918847a04F8Aa73fE4');
  const {mutateAsync: createCampaign}= useContractWrite(contract, 'createCampaign');

  const address= useAddress();
  const connect= useMetamask();

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign({
				args: [
					address, // owner
					form.title, // title
					form.description, // description
					form.target,
					new Date(form.deadline).getTime(), // deadline,
					form.image,
				],
			});

      console.log("contract call success", data)
    } catch (error) {
      console.log("contract call failure", error)
    }
  }


  const getCampaigns= async()=>{
    const campaigns= await contract.call('getCampaigns');
    const parseCampaigns= campaigns.map((campaign,i)=>({
     owner: campaign.owner,
     title: campaign.title,
     description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i
    }))
    return parseCampaigns;
  }


  const getUserCampaigns= async ()=>{
    const allCampaigns= await getCampaigns();
    const filteredCampaigns = allCampaigns.filter((campaign)=> campaign.owner === address);
    return filteredCampaigns;
  }


  const donate= async(pId, amount)=>{
    const data= await contract.call('donateToCampaign', [pId], {value: ethers.utils.parseEther(amount)});
    return data;
  }

  const getDonations= async(pId)=>{
    const donations= await contract.call('getDonators', [pId]);
    const numberOfDonations = donations[0].length;

    const parseDonations= [];
    for( let i=0; i<numberOfDonations; i++ ){
      parseDonations.push({
        donator: donations[0][i],
        donations: ethers.utils.formatEther(donations[1][i].toString())
      })
  }
  return parseDonations;
  }



  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
    </StateContext.Provider>
  );

      };
export const useStateContext = () => useContext(StateContext);