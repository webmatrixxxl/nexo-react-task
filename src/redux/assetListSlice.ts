import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssetListItem, Exchange } from '../Components/AssetList/AssetList';
import { AssetPair } from '../Components/AssetSearch/AssetSearch';

export interface AssetListState {
  assetListItems: AssetListItem[];
  currencySymbol: AssetPair;
  exchange: Exchange | null;
  exchangeList: Exchange[];
  isLoading: boolean;
  isModalOpen: boolean;
  searchQuery: string;
}

const initialState: AssetListState = {
  assetListItems: [],
  currencySymbol: { symbol: 'BTC/USDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
  exchange: null,
  exchangeList: [],
  isLoading: true,
  isModalOpen: false,
  searchQuery: '',
};

const assetListSlice = createSlice({
  name: 'assetList',
  initialState,
  reducers: {
    setAssetListItems: (state, action: PayloadAction<AssetListItem[]>) => {
      state.assetListItems = action.payload;
    },
    setCurrencySymbol: (state, action: PayloadAction<AssetPair>) => {
      state.currencySymbol = action.payload;
    },
    setExchange: (state, action: PayloadAction<Exchange | null>) => {
      state.exchange = action.payload;
    },
    setExchangeList: (state, action: PayloadAction<Exchange[]>) => {
      state.exchangeList = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setIsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isModalOpen = action.payload;
    },
    setIsSupported: (
      state,
      action: PayloadAction<{ index: number; isSupported: boolean }>
    ) => {
      // if (
      //   state.exchangeList[action.payload.index].isSupported !=
      //   action.payload.isSupported
      // ) {
      //   state.exchangeList[action.payload.index].isSupported =
      //     action.payload.isSupported;
      // }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    resetExchangeListIsSupported: (state) => {
      state.exchangeList = state.exchangeList.map((exchange) => {
        // exchange.isSupported = true;
        return exchange;
      });
    },
  },
});

export const {
  setAssetListItems,
  setCurrencySymbol,
  setExchange,
  setExchangeList,
  setIsLoading,
  setIsModalOpen,
  setIsSupported,
  setSearchQuery,
  resetExchangeListIsSupported,
} = assetListSlice.actions;

export default assetListSlice.reducer;
