# Deployer

The Deployer offers several functionalities:

---

- **deploy(contractInstance, argsOrParameters, parameters)**:
 
Utilizes `ContractFactory` from [@ethers](https://www.npmjs.com/package/ethers) to deploy contracts, inferring types and providing enhanced functionalities like transaction recovery and reporting. It also stores deployment transaction data for later contract verification.

---

- **save(contractInstance | name, address, force [default: false])**:
 
Saves the contract to storage under the given `address` without deployment. 
If force is set to `true`, the contract will be saved even if it is not deployed.

---

- **deployed(contractInstance, contractIdentifier)**: 

Returns the deployed contract instance, inferring types and enhancing functionalities for comfortable interaction.

---

- **deployERC1967Proxy(implementationFactory, argsOrParameters, parameters)**:

Deploys an implementation contract and an ERC1967 proxy pointing to it. The implementation is deployed first, and then the proxy is deployed with the implementation's address. Returns a contract instance representing the proxied implementation.

---

- **deployTransparentUpgradeableProxy(implementationFactory, proxyAdmin, argsOrParameters, parameters)**:

Deploys an implementation contract and a Transparent Upgradeable Proxy pointing to it. Requires a valid proxy admin address. Returns a contract instance representing the proxied implementation.

---

- **deployProxy(implementationFactory, proxyFactoryName, proxyArgs, argsOrParameters, parameters)**:

Generic method for deploying proxies with custom logic.

---

- **sendNative(to, value, name <- optional)**: 

Facilitates sending native assets to a specified address, primarily for the recovery process.

---

- **setSigner(from <- optional)**:

Sets the signer for the following transactions and deployments.

If the `from` parameter is not specified, the signer is reset to the default.

---

- **getSigner(from <- optional)**: 

Retrieves an ethers signer for use in migrations.

---

- **getChainId()**: 

Identifies the current chain ID for the deployment.
