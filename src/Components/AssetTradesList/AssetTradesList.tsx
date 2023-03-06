import React, { useCallback, useEffect } from 'react';
import type { ColumnsType } from 'antd/es/table';
import Table from 'antd/es/table';
import { AxiosResponse } from 'axios';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import axiosInstance from '../../axios-instance';
import {
  getObjectPropertyByIndex,
  replacePathVairables,
} from '../../utils/utils';
import { RootState } from '../../redux/store/store';

interface TradeItem {
  id: string;
  key?: React.Key;
  price: string;
  amount: string;
  time: number;
  isBuyerMaker: boolean;
}

interface AssetTradesListProps {
  className?: string;
}

const DEFAULT_TRADE_LIMIT = 10;

const AssetTradesList: React.FC<AssetTradesListProps> = ({
  className = '',
}) => {
  const [exchangeTradeList, setExchangeTradeList] = React.useState<TradeItem[]>(
    []
  );

  const { currencySymbol, exchange } = useSelector(
    (state: RootState) => state.assetListReducer
  );

  const getTradeListBySymbol = useCallback(() => {
    /**
     * Make requests for to current exchanges and get last several trades for the selected asset pair.
     * Because the API's of the different exchanges are not consistent, the properties
     * of recived data have to be mapped to have unified interface.
     * Then mappings are described in EXCHANGE_LIST_DATA object.
     */

    if (exchange) {
      let symbol = `${currencySymbol.symbol.replaceAll(/\//gi, '')}`;
      symbol =
        exchange.api.recentTrades.case === 'upper'
          ? symbol.toUpperCase()
          : symbol.toLowerCase();

      const exchangeTradeItems = [] as TradeItem[];

      axiosInstance
        .get(
          `${exchange.api.url}${replacePathVairables(
            exchange.api.recentTrades.path,
            symbol,
            DEFAULT_TRADE_LIMIT
          )}`
        )
        .then((res: AxiosResponse) => {
          if (res.status === 200 || res.status === 201) {
            const dataArray = Array.isArray(res.data)
              ? res.data
              : getObjectPropertyByIndex(
                  res.data,
                  exchange.api.recentTrades.data
                ) || [];

            dataArray.forEach((tradeItem: TradeItem, index: number) => {
              const id = tradeItem.id || index.toString();

              exchangeTradeItems.push({
                id: id,
                key: id,
                price: getObjectPropertyByIndex(
                  tradeItem,
                  exchange.api.recentTrades.properties.price
                ),
                amount: getObjectPropertyByIndex(
                  tradeItem,
                  exchange.api.recentTrades.properties.amount
                ),
                time: getObjectPropertyByIndex(
                  tradeItem,
                  exchange.api.recentTrades.properties.time
                ),
                isBuyerMaker:
                  getObjectPropertyByIndex(
                    tradeItem,
                    exchange.api.recentTrades.properties.isBuyerMaker.prop
                  ) === exchange.api.recentTrades.properties.isBuyerMaker.value,
              });
            });
          }

          setExchangeTradeList(exchangeTradeItems);
        });
    }
  }, [currencySymbol, exchange]);

  const columnsTradesList: ColumnsType<TradeItem> = [
    {
      title: `Price (${currencySymbol.symbol})`,
      dataIndex: 'price',
      render: (price, tradeItem) => {
        return (
          <span
            className={
              tradeItem.isBuyerMaker ? 'text-green-700' : 'text-red-700'
            }
          >
            {tradeItem.isBuyerMaker ? (
              <ArrowUpOutlined />
            ) : (
              <ArrowDownOutlined />
            )}
            {price}
          </span>
        );
      },
    },
    {
      title: `Amount (${currencySymbol.symbol})`,
      dataIndex: 'amount',
      align: 'right',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      align: 'right',
      render: (time) => {
        return <>{new Date(time).toLocaleTimeString()}</>;
      },
    },
  ];

  useEffect(() => {
    getTradeListBySymbol();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencySymbol.symbol, exchange]);

  return (
    <div className={`asset-trade-list ${className}`}>
      <Table columns={columnsTradesList} dataSource={exchangeTradeList} />
    </div>
  );
};

export default AssetTradesList;
