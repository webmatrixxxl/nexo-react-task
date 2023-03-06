import { createSlice } from '@reduxjs/toolkit';
import { AssetPair } from '../Components/AssetSearch/AssetSearch';
import { currencySymbolToAssetPair } from '../utils/utils';

export interface AssetListSearchState {
  assetPairs: AssetPair[];
  currentAssetPair: AssetPair;
  isSelectedExisting: boolean;
  isLoading: boolean;
}

const initialState: AssetListSearchState = {
  assetPairs: [],
  currentAssetPair: { ...currencySymbolToAssetPair('') },
  isSelectedExisting: false,
  isLoading: false,
};

const assetListSearchSlice = createSlice({
  name: 'assetListSearch',
  initialState,
  reducers: {
    setAssetPairs(state, action) {
      state.assetPairs = action.payload;
    },
    setCurrentAssetPair(state, action) {
      state.currentAssetPair = action.payload;
    },
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
    setIsSelectedExisting(state, action) {
      state.isSelectedExisting = action.payload;
    },
  },
});

export const {
  setAssetPairs,
  setCurrentAssetPair,
  setIsLoading,
  setIsSelectedExisting,
} = assetListSearchSlice.actions;

export default assetListSearchSlice.reducer;
