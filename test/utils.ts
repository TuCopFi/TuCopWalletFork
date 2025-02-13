/* Utilities to facilitate testing */
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { ReactTestInstance } from 'react-test-renderer'
import configureMockStore from 'redux-mock-store'
import i18n from 'src/i18n'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { getLatestSchema } from 'test/schemas'
import {
  mockAddressToE164Number,
  mockAppRecipientCache,
  mockContractAddress,
  mockE164NumberToAddress,
  mockNavigation,
  mockPhoneRecipientCache,
} from 'test/values'

// ContractKit test utils
export const mockContractKitBalance = jest.fn(() => new BigNumber(10))
export const mockContractKitContract = {
  balanceOf: mockContractKitBalance,
  decimals: jest.fn(async () => '10'),
  transferWithComment: jest.fn(async () => '10'),
}

interface MockContract {
  methods: {
    [methodName: string]: MockMethod
  }
  options: {
    address: string
  }
}

type MockMethod = (...params: any) => {
  call: () => any
  estimateGas: () => number
  send: SendMethod
}
type SendMethod = (...params: any) => { on: (...params: any) => any }

/**
 * Create a mock contract
 * @param methods object
 */
export function createMockContract(methods: { [methodName: string]: any }) {
  const contract: MockContract = {
    methods: {},
    options: {
      address: mockContractAddress,
    },
  }
  for (const methodName of Object.keys(methods)) {
    const callResult = methods[methodName]
    contract.methods[methodName] = createMockMethod(callResult)
  }
  return contract
}

function createMockMethod(callResult: any): MockMethod {
  return jest.fn(() => ({
    call: jest.fn(() => (typeof callResult === 'function' ? callResult() : callResult)),
    estimateGas: jest.fn(() => 10000),
    send: createSendMethod(),
  }))
}

function createSendMethod(): SendMethod {
  return jest.fn(() => ({
    on: createSendMethod(),
  }))
}

const mockStore = configureMockStore<RootState>()

/* Create a mock store with some reasonable default values */
export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> }
export function createMockStore(overrides: RecursivePartial<RootState> = {}) {
  return mockStore(getMockStoreData(overrides))
}

export function getMockStoreData(overrides: RecursivePartial<RootState> = {}): RootState {
  const defaultSchema = getLatestSchema()
  const contactMappingData = {
    identity: {
      ...defaultSchema.identity,
      addressToE164Number: mockAddressToE164Number,
      e164NumberToAddress: mockE164NumberToAddress,
    },
  }
  const recipientData = {
    recipients: {
      ...defaultSchema.recipients,
      phoneRecipientCache: mockPhoneRecipientCache,
      appRecipientCache: mockAppRecipientCache,
    },
  }
  const mockStoreData: any = {
    ...defaultSchema,
    ...contactMappingData,
    ...recipientData,

    // ignore api reducers that are managed by RTK-Query library itself
    transactionFeedV2Api: undefined,
  }

  // Apply overrides. Note: only merges one level deep
  for (const key of Object.keys(overrides)) {
    // @ts-ignore
    mockStoreData[key] = { ...mockStoreData[key], ...overrides[key] }
  }

  return mockStoreData
}

export function createMockStoreAppDisconnected() {
  return createMockStore({
    networkInfo: { connected: false },
  })
}

export function getMockI18nProps() {
  return {
    i18n,
    t: i18n.t,
    tReady: true,
  }
}

export function getMockStackScreenProps<RouteName extends keyof StackParamList>(
  ...args: undefined extends StackParamList[RouteName]
    ? [RouteName] | [RouteName, StackParamList[RouteName]]
    : [RouteName, StackParamList[RouteName]]
): NativeStackScreenProps<StackParamList, RouteName> {
  const [name, params] = args
  return {
    navigation: mockNavigation,
    // @ts-ignore
    route: {
      key: '1',
      name,
      params,
    },
  }
}

export function getElementText(instance: ReactTestInstance | string): string {
  if (typeof instance === 'string') {
    return instance
  }
  return instance.children
    .map((child) => {
      return getElementText(child)
    })
    .join('')
}

export const mockStoreBalancesToTokenBalances = (
  storeBalances: StoredTokenBalance[]
): TokenBalance[] => {
  return storeBalances.map(
    (token): TokenBalance => ({
      ...token,
      balance: new BigNumber(token.balance ?? 0),
      priceUsd: new BigNumber(token.priceUsd ?? 0),
      lastKnownPriceUsd: token.priceUsd ? new BigNumber(token.priceUsd) : null,
    })
  )
}
