import MetaMaskOnboarding from '@metamask/onboarding'
import { ethers } from 'ethers'
import { hstAbi, hstBytecode, piggybankAbi, piggybankBytecode } from './constants.json'
import { requestAccounts } from './modules/BasicActions'

let ethersProvider
let hstFactory
let piggybankFactory

const currentUrl = new URL(window.location.href)
const forwarderOrigin = currentUrl.hostname === 'localhost'
  ? 'http://localhost:9010'
  : undefined

const { isMetaMaskInstalled } = MetaMaskOnboarding

// Dapp Status Section
const networkDiv = document.getElementById('network')
const chainIdDiv = document.getElementById('chainId')
const accountsDiv = document.getElementById('accounts')

// Basic Actions Section
const onboardButton = document.getElementById('connectButton')
const getAccountsButton = document.getElementById('getAccounts')
const getAccountsResults = document.getElementById('getAccountsResult')

const initialize = async () => {
  try {
    // We must specify the network as 'any' for ethers to allow network changes
    ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    hstFactory = new ethers.ContractFactory(
      hstAbi,
      hstBytecode,
      ethersProvider.getSigner(),
    )
    piggybankFactory = new ethers.ContractFactory(
      piggybankAbi,
      piggybankBytecode,
      ethersProvider.getSigner(),
    )
  } catch (error) {
    console.error(error)
  }

  let onboarding
  try {
    onboarding = new MetaMaskOnboarding({ forwarderOrigin })
  } catch (error) {
    console.error(error)
  }

  let accounts
  let accountButtonsInitialized = false

  // Button List
  const accountButtons = []

  const isMetaMaskConnected = () => accounts && accounts.length > 0

  const onClickInstall = () => {
    onboardButton.innerText = 'Onboarding in progress'
    onboardButton.disabled = true
    onboarding.startOnboarding()
  }

  const onClickConnect = async () => {
    try {
      const newAccounts = requestAccounts()
      handleNewAccounts(newAccounts)
    } catch (error) {
      console.error(error)
    }
  }

  const updateButtons = () => {
    const accountButtonsDisabled = !isMetaMaskInstalled() || !isMetaMaskConnected()
    if (accountButtonsDisabled) {
      for (const button of accountButtons) {
        button.disabled = true
      }
      // clearTextDisplays()
    } else {
      // deployButton.disabled = false
      // sendButton.disabled = false
      // createToken.disabled = false
      // personalSign.disabled = false
      // signTypedData.disabled = false
      // getEncryptionKeyButton.disabled = false
      // ethSign.disabled = false
      // personalSign.disabled = false
      // signTypedData.disabled = false
      // signTypedDataV3.disabled = false
      // signTypedDataV4.disabled = false
    }

    if (!isMetaMaskInstalled()) {
      onboardButton.innerText = 'Click here to install MetaMask!'
      onboardButton.onclick = onClickInstall
      onboardButton.disabled = false
    } else if (isMetaMaskConnected()) {
      onboardButton.innerText = 'Connected'
      onboardButton.disabled = true
      if (onboarding) {
        onboarding.stopOnboarding()
      }
    } else {
      onboardButton.innerText = 'Connect'
      onboardButton.onclick = onClickConnect
      onboardButton.disabled = false
    }
  }
  const getAccountsButtonAction = () => {
    getAccountsButton.onclick = async () => {
      try {
        const _accounts = await ethereum.request({ method: 'eth_accounts' })
        getAccountsResults.appendChild(document.createTextNode(`${_accounts[0] || 'Not able to get accounts'}`))
      } catch (err) {
        console.error(err)
        getAccountsResults.appendChild(document.createTextNode(`Error: ${err.message}`))
      }
    }
  }

  const initializeAccountButtons = () => {
    getAccountsButtonAction()

    if (accountButtonsInitialized) {
      return
    }
    accountButtonsInitialized = true
  }

  function handleNewAccounts (newAccounts) {
    accounts = newAccounts
    accountsDiv.appendChild(document.createTextNode(accounts))
    if (isMetaMaskConnected()) {
      initializeAccountButtons()
    }
    updateButtons()
  }

  function handleNewChain (chainId) {
    chainIdDiv.appendChild(document.createTextNode(chainId))
  }
  function handleNewNetwork (networkId) {
    networkDiv.appendChild(document.createTextNode(networkId))
  }

  async function getNetworkAndChainId () {
    try {
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      })
      const networkId = await ethereum.request({
        method: 'net_version',
      })

      handleNewChain(chainId)
      handleNewNetwork(networkId)
    } catch (err) {
      console.error(err)
    }
  }

  updateButtons()

  if (isMetaMaskInstalled()) {

    ethereum.autoRefreshOnNetworkChange = false
    getNetworkAndChainId()
    ethereum.on('networkChanged', handleNewNetwork)
    ethereum.on('chainChanged', handleNewChain)
    ethereum.on('accountsChanged', handleNewAccounts)

    try {
      const newAccounts = await ethereum.request({
        method: 'eth_accounts',
      })
      handleNewAccounts(newAccounts)
    } catch (err) {
      console.error('Error on init when getting accounts', err)
    }
  }
}
window.addEventListener('DOMContentLoaded', initialize)
