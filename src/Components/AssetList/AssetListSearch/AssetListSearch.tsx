import { FC, useEffect, useState } from 'react';
import { AxiosResponse } from 'axios';
import { SelectProps, AutoComplete, Input } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { Exchange } from '../AssetList';
import axiosInstance from '../../../axios-instance';
import { assetPairToSymbols } from '../../../utils/utils';
import { AssetSymbolImg } from '../../AssetSymbolImg/AssetSymbolImg';

export interface AssetPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

interface AssetListSearchProps {
  className?: string;
  defaultPair: string;
  exchange: Exchange;
  onAssetPairChange?: (symbol: string, isSelectedIn: boolean) => void;
}

const AssetListSearch: FC<AssetListSearchProps> = ({
  defaultPair,
  className = '',
  exchange,
  onAssetPairChange = () => {},
}) => {
  const [assetPairs, setAssetPairs] = useState<AssetPair[]>([]);
  const [currentAssetPair, setCurrentAssetPair] = useState<AssetPair>({
    ...assetPairToSymbols(defaultPair),
  });
  const [options, setOptions] = useState<SelectProps<object>['options']>([]);
  const [isSelectedIn, setIsSelectedExisting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getAssetPairs = (): void => {
    setIsLoading(true);
    setIsSelectedExisting(false);

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

            if (currentAssetPair.symbol === assetPair.symbol) {
              setIsSelectedExisting(true);
            }

            return assetPair;
          });

          setAssetPairs(assetSymbols);
        }
      })
      .finally(() => {
        setIsLoading(false);
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

    setIsSelectedExisting(true);
    onAssetPairChange(value, true);
    setCurrentAssetPair({
      symbol: value,
      baseAsset: assetPairsParsed[0],
      quoteAsset: assetPairsParsed[1],
    });
  };

  useEffect(() => {
    onAssetPairChange(currentAssetPair.symbol, isSelectedIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetPairs, currentAssetPair.symbol, isSelectedIn]);

  useEffect(() => {
    getAssetPairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    searchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetPairs]);

  return (
    <div className={`asset-list-search ${className}`}>
      <AutoComplete
        dropdownMatchSelectWidth={252}
        style={{ width: 300 }}
        options={options}
        defaultValue={defaultPair}
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
                currentAssetPair &&
                isSelectedIn && (
                  <>
                    <AssetSymbolImg assetSymbol={currentAssetPair.baseAsset} />
                    <AssetSymbolImg assetSymbol={currentAssetPair.quoteAsset} />
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

export default AssetListSearch;
