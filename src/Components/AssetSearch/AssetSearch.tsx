import { FC, useEffect, useState } from 'react';
import { AxiosResponse } from 'axios';
import { AutoComplete, Input, SelectProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { EXCHANGE_LIST_DATA } from '../AssetList/AssetList';
import axiosInstance from '../../axios-instance';
import { AssetSymbolImg } from '../AssetSymbolImg/AssetSymbolImg';
import {
  setIsLoading,
  setIsSelectedExisting,
  setAssetPairs,
} from '../../redux/assetListSearchSlice';
import { setCurrencySymbol } from '../../redux/assetListSlice';
import { RootState } from '../../redux/store/store';
import { currencySymbolToAssetPair } from '../../utils/utils';

export interface AssetPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

interface AssetSearchProps {
  className?: string;
  defaultCurrencySymbol: string;
  onAssetPairChange?: (
    currencySymbol: AssetPair,
    isSelectedExisting: boolean
  ) => void;
}

const AssetSearch: FC<AssetSearchProps> = ({
  className = '',
  defaultCurrencySymbol,
  onAssetPairChange = () => {},
}) => {
  const dispatch = useDispatch();
  const { assetPairs, isSelectedExisting, isLoading } = useSelector(
    (state: RootState) => state.assetListSearchReducer
  );
  const { currencySymbol } = useSelector(
    (state: RootState) => state.assetListReducer
  );
  const [options, setOptions] = useState<SelectProps<object>['options']>([]);

  /**
   * I point to specific exchange (Binance) to get asset pairs.
   * In the future, It can be changed to get asset pairs from all exchanges or just from one.
   * */
  const exchange = EXCHANGE_LIST_DATA[0];

  const getAssetPairs = (): void => {
    dispatch(setIsLoading(true));
    dispatch(setIsSelectedExisting(false));

    axiosInstance
      .get(`${exchange.api.url}${exchange.api.exchangeInfo.path}`)
      .then((res: AxiosResponse) => {
        if (res.status === 200 || res.status === 201) {
          const assetSymbols = res.data.symbols.map((symbol: AssetPair) => {
            const assetPair = {
              symbol: `${symbol.baseAsset}/${symbol.quoteAsset}`.toUpperCase(),
              baseAsset: symbol.baseAsset.toUpperCase(),
              quoteAsset: symbol.quoteAsset.toUpperCase(),
            };

            if (currencySymbol.symbol === assetPair.symbol) {
              if (currencySymbol.symbol !== defaultCurrencySymbol) {
                dispatch(
                  setCurrencySymbol(
                    currencySymbolToAssetPair(defaultCurrencySymbol)
                  )
                );
              }

              dispatch(setIsSelectedExisting(true));
            }

            return assetPair;
          });

          dispatch(setAssetPairs(assetSymbols));
        }
      })
      .finally(() => {
        dispatch(setIsLoading(false));
      });
  };

  const searchResult = (query = '') => {
    const queryNormalized = query.toUpperCase().replaceAll(/[\s/]+/g, '');

    return assetPairs
      .filter((assetPair: AssetPair) =>
        assetPair.symbol.includes(queryNormalized)
      )
      .map((assetPair: AssetPair) => {
        return {
          value: `${assetPair.symbol}`,
          label: (
            <div className="grid grid-flow-col gap-2 items-center justify-start">
              <AssetSymbolImg assetSymbol={assetPair.baseAsset} />
              <AssetSymbolImg assetSymbol={assetPair.quoteAsset} />
              {assetPair.baseAsset}/{assetPair.quoteAsset}
            </div>
          ),
        };
      });
  };

  const handleSearch = (value: string) => {
    setOptions(value ? searchResult(value) : []);
  };

  const onSelect = (value: string) => {
    /**
     * No point here to verify that selected asset pair is in the list of asset pairs.
     * UI element is AutoComplete, so user can't enter any value. This is why we don't need to verify.
     * */
    const assetPairsParsed = value.split('/');

    const newCurrencySymbol = {
      symbol: value,
      baseAsset: assetPairsParsed[0],
      quoteAsset: assetPairsParsed[1],
    };

    dispatch(setIsSelectedExisting(true));
    dispatch(setCurrencySymbol(newCurrencySymbol));
    onAssetPairChange(newCurrencySymbol, true);
  };

  useEffect(() => {
    getAssetPairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`asset-list-search ${className}`}>
      <AutoComplete
        dropdownMatchSelectWidth={252}
        style={{ width: 300 }}
        options={options}
        defaultValue={defaultCurrencySymbol}
        onSelect={onSelect}
        onSearch={handleSearch}
        disabled={!assetPairs.length}
      >
        <Input.Search
          prefix={
            <span className="grid grid-flow-col justify-center gap-2 w-12">
              {isLoading ? (
                <LoadingOutlined />
              ) : (
                currencySymbol &&
                isSelectedExisting && (
                  <>
                    <AssetSymbolImg assetSymbol={currencySymbol.baseAsset} />
                    <AssetSymbolImg assetSymbol={currencySymbol.quoteAsset} />
                  </>
                )
              )}
            </span>
          }
          size="large"
          placeholder="Search coin pair"
          enterButton
        />
      </AutoComplete>
    </div>
  );
};

export default AssetSearch;
