const BACDAIPool = artifacts.require('BACDAIPool')

contract("BACDAIPool", () => {
    it("...should deploy and successfully call using the method's provided gas estimate", async () => {
      const BACDAIPoolInstance = await BACDAIPool.new();
  
  const gasEstimate = await BACDAIPoolInstance.stake.estimateGas();
  
  const tx = await BACDAIPoolInstance.stake({
        gas: gasEstimate
      });
      assert(tx);
    });
  });
  

