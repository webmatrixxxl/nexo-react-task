import { configureStore } from '@reduxjs/toolkit';
import assetListSearchSlice, {
  AssetListSearchState,
} from '../assetListSearchSlice';
import assetListSlice, { AssetListState } from '../assetListSlice';

export interface RootState {
  assetListReducer: AssetListState;
  assetListSearchReducer: AssetListSearchState;
}

export default configureStore<RootState>({
  reducer: {
    assetListReducer: assetListSlice,
    assetListSearchReducer: assetListSearchSlice,
  },
});
