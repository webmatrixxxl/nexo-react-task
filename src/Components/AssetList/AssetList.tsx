import { FC, Key, useEffect, useState } from 'react';
import { Button, Empty, Modal, Skeleton, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useParams, useNavigate, useLocation, NavLink } from 'react-router-dom';
import ExchangeListSearch from './AssetListSearch/AssetListSearch';
import AssetTradesList from './AssetTradesList/AssetTradesList';
import axiosInstance from '../../axios-instance';
import {
  assetPairURLToSymbol,
  assetSymbolToProiderConvention,
  assetSymbolToURLPair,
  getObjectPropertyByIndex,
} from '../../utils/utils';

export const DEFAULT_REQUEST_TIMEOUT = 5000;
const DEFAULT_CURRENCY = 'BTC/USDT';

export interface Exchange {
  id: string;
  name: string;
  api: {
    url: string;
    priceBySymbol: {
      path: string;
      case: string;
      properties: { [x: string]: any };
    };
    [x: string]: any;
  };
}

const EXCHANGE_LIST_DATA: Exchange[] = [
  {
    id: '1',
    name: 'Binance',
    api: {
      url: 'https://www.binance.com/api/v3/',
      exchangeInfo: {
        path: 'exchangeInfo',
      },
      priceBySymbol: {
        path: 'ticker/price?symbol=',
        case: 'upper',
        properties: {
          price: 'price',
        },
      },
      recentTrades: {
        path: (symbol: string, limit?: number) =>
          `trades?symbol=${symbol}&limit=${limit}`,
        case: 'upper',
        properties: {
          price: 'price',
          amount: 'qty',
          time: 'time',
          isBuyerMaker: {
            prop: 'isBuyerMaker',
            value: true,
          },
        },
      },
    },
  },
  {
    id: '2',
    name: 'Bitfinex',
    api: {
      url: '/bitfinex/', // Proxy to avoid CORS on some of the APIs.
      priceBySymbol: {
        path: 'pubticker/',
        case: 'upper',
        properties: {
          price: 'last_price',
        },
      },
      recentTrades: {
        path: (symbol: string, limit?: number) =>
          `trades/${symbol}?limit_trades=${limit}`,
        case: 'upper',
        properties: {
          price: 'price',
          amount: 'amount',
          time: 'timestamp',
          isBuyerMaker: {
            prop: 'type',
            value: 'buy',
          },
        },
      },
    },
  },
  {
    id: '3',
    name: 'Huobi',
    api: {
      url: 'https://api.huobi.pro/',
      priceBySymbol: {
        path: 'market/detail/merged?symbol=',
        case: 'lower',
        properties: {
          price: 'tick.ask.[0]',
        },
      },
      recentTrades: {
        path: (symbol: string, limit?: number) =>
          `market/history/trade?symbol=${symbol}&size=${limit}`,
        case: 'lower',
        data: 'data',
        properties: {
          price: 'data[0].price',
          amount: 'data[0].amount',
          time: 'ts',
          isBuyerMaker: {
            prop: 'data[0].direction',
            value: 'buy',
          },
        },
      },
    },
  },
  {
    id: '4',
    name: 'Kraken',
    api: {
      url: '/kraken/', // Proxy to avoid CORS on some of the APIs.
      priceBySymbol: {
        path: 'Ticker?pair=',
        case: 'upper',
        properties: {
          price: 'result[0].a[0]',
        },
      },
      recentTrades: {
        path: (symbol: string) => `Trades?pair=${symbol}`,
        case: 'upper',
        data: 'result[0]',
        properties: {
          price: '[0]',
          amount: '[1]',
          time: '[2]',
          isBuyerMaker: {
            prop: '[3]',
            value: 'b',
          },
        },
      },
    },
  },
];

export interface AssetListItem {
  key: Key;
  name: string;
  price: string;
  symbol: string;
}

interface AssetListProps {
  className?: string;
}

const AssetList: FC<AssetListProps> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const paramsURL = useParams();

  const [assetListItems, setAssetListItems] = useState<AssetListItem[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState<string>('');
  const defaultPair: string = paramsURL.pair
    ? assetPairURLToSymbol(paramsURL.pair)
    : DEFAULT_CURRENCY;
  const [exchange, setExchange] = useState<Exchange | null>();
  const [exchangeList, setExchangeList] =
    useState<Exchange[]>(EXCHANGE_LIST_DATA);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    // Close the AssetsTradesList modal `details` and redirect to the default pair.

    setIsModalOpen(false);
    const newUrl = paramsURL.pair || '/';
    navigate(newUrl, {
      replace: true,
    });
  };

  const handleAssetPairsChange = (
    symbol: string,
    isSelectedAssetFound: boolean
  ) => {
    // Trigger change if the asset is found in the list.

    if (isSelectedAssetFound) {
      setCurrencySymbol(symbol);
    }
  };

  const getAssetPriceBySymbol = (): void => {
    /**
     * Make requests for all exchanges and get the price for the selected asset pair.
     * Because the API's of the different exchanges are not consistent, the properties
     * of recived data have to be mapped to have unified interface.
     * Then mappings are described in EXCHANGE_LIST_DATA object.
     *
     * TODO: Should exclude requests to exchanges that do not have the selected asset pair.
     * Now it's just a waste of resources to make API calls.
     * TODO: Make functions pure.
     */
    setIsLoading(true);
    const symbolNormalized = `${assetSymbolToProiderConvention(
      currencySymbol
    )}`;

    const exchangeRequests = exchangeList.map((exchangeData) => {
      const symbolCaseByExchange =
        exchangeData.api.priceBySymbol.case === 'upper'
          ? symbolNormalized.toUpperCase()
          : symbolNormalized.toLowerCase();

      return axiosInstance.get(
        `${exchangeData.api.url}${exchangeData.api.priceBySymbol.path}${symbolCaseByExchange}`
      );
    });

    const assetPriceItems = [] as AssetListItem[];

    Promise.allSettled(exchangeRequests)
      .then((responses) => {
        responses.forEach((res: any, index) => {
          assetPriceItems.push({
            key: exchangeList[index].id,
            name: exchangeList[index].name,
            price: res.value
              ? getObjectPropertyByIndex(
                  res.value.data,
                  exchangeList[index].api.priceBySymbol.properties.price
                )
              : null,
            symbol: currencySymbol,
          });
        });

        setAssetListItems(assetPriceItems);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const columnsAssetListTable: ColumnsType<AssetListItem> = [
    {
      title: 'Name',
      dataIndex: 'symbol',
    },
    {
      title: 'Exchange',
      dataIndex: 'name',
      width: '60%',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      align: 'right',
      sorter: (a, b) => parseFloat(a.price) - parseFloat(b.price), // TODO: check if values arr corectly parsed,
      render: (price, exchangeListItem) => (
        <NavLink
          onClick={(e) => {
            if (!price) {
              e.preventDefault();
              return;
            }
          }}
          to={
            price ? `${paramsURL.pair}/${exchangeListItem?.name}/details` : '#'
          }
        >
          <Button disabled={!price} type="link">
            {price ? price : 'N/A'}
          </Button>
        </NavLink>
      ),
    },
  ];

  useEffect(() => {
    if (currencySymbol) {
      /**
       * If the asset pair is changed, the URL is updated and the price is requested.
       * The price is requested every DEFAULT_REQUEST_TIMEOUT ms.
       * The timer is cleared when the component is unmounted.
       * */

      const newUrlSymbol = assetSymbolToURLPair(currencySymbol);
      const newUrl = paramsURL.pair
        ? location.pathname.replace(paramsURL.pair, newUrlSymbol)
        : `${location.pathname}${
            !location.pathname.endsWith('/') && '/'
          }${newUrlSymbol}`;

      navigate(newUrl, {
        replace: true,
      });

      getAssetPriceBySymbol();

      const getAssetPriceBySymbolTimer = setInterval(() => {
        getAssetPriceBySymbol();
      }, DEFAULT_REQUEST_TIMEOUT);

      return () => {
        clearInterval(getAssetPriceBySymbolTimer);
      };
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencySymbol]);

  useEffect(() => {
    /**
     *  If the exchange is changed in the URL and it is existing one, the modal is opened.
     * */

    const exchangeData = exchangeList.find(
      (exchangeItem) => exchangeItem?.name === paramsURL.exchange
    );

    if (exchangeData) {
      setExchange(exchangeData);
      showModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsURL.exchange]);

  return (
    <div
      className={`asset-list grid grid-flow-row gap-2 items-end ${className}`}
    >
      <Modal
        title="Trades List"
        open={isModalOpen}
        onOk={handleCancel}
        onCancel={handleCancel}
      >
        {currencySymbol && exchange && (
          <AssetTradesList currentSymbol={currencySymbol} exchange={exchange} />
        )}
      </Modal>
      <ExchangeListSearch
        className="place-self-end"
        defaultPair={defaultPair}
        exchange={EXCHANGE_LIST_DATA[0]}
        onAssetPairChange={handleAssetPairsChange}
      />
      <Table
        columns={columnsAssetListTable}
        dataSource={assetListItems}
        locale={{
          emptyText: isLoading ? (
            <div className={`grid grid-flow-col gap-4 grid-rows-6`}>
              {Array(6)
                .fill(null)
                .map((k, i) => (
                  <Skeleton.Input
                    key={i}
                    style={{ width: '100%' }}
                    active={true}
                  />
                ))}
            </div>
          ) : (
            <Empty />
          ),
        }}
      />
    </div>
  );
};

export default AssetList;
