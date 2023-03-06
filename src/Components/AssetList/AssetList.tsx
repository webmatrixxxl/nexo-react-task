import { FC, Key, useCallback, useEffect } from 'react';
import { Button, Empty, Modal, Skeleton, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useParams, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ExchangeListSearch, { AssetPair } from '../AssetSearch/AssetSearch';
import AssetTradesList from '../AssetTradesList/AssetTradesList';
import axiosInstance from '../../axios-instance';
import {
  assetPairURLToSymbol,
  assetSymbolToProiderConvention,
  assetPairSymbolToURL,
  getObjectPropertyByIndex,
} from '../../utils/utils';
import {
  setAssetListItems,
  setExchange,
  setIsModalOpen,
  setIsLoading,
  setExchangeList,
  setIsSupported,
} from '../../redux/assetListSlice';
import { RootState } from '../../redux/store/store';

export const DEFAULT_REQUEST_TIMEOUT = 5000;

export interface ExchangeData {
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

export interface Exchange extends ExchangeData {
  isSupported?: boolean;
}

export const EXCHANGE_LIST_DATA: ExchangeData[] = [
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
        path: `trades?symbol={symbol}&limit={limit}`,
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
        path: `trades/{symbol}?limit_trades={limit}`,
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
        path: `market/history/trade?symbol={symbol}&size={limit}`,
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
        path: 'Trades?pair={symbol}',
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
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const paramsURL = useParams();

  useEffect(() => {
    dispatch(setExchangeList(EXCHANGE_LIST_DATA));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    assetListItems,
    currencySymbol,
    exchange,
    exchangeList,
    isModalOpen,
    isLoading,
  } = useSelector((state: RootState) => state.assetListReducer);

  const defaultCurrencySymbol: string = paramsURL.pair
    ? assetPairURLToSymbol(paramsURL.pair)
    : currencySymbol.symbol;

  const getAssetPriceBySymbol = useCallback((): void => {
    /**
     * Make requests for all exchanges and get the price for the selected asset pair.
     * Because the API's of the different exchanges are not consistent, the properties
     * of recived data have to be mapped to have unified interface.
     * Then mappings are described in EXCHANGE_LIST_DATA object.
     */

    dispatch(setIsLoading(true));

    const symbolNormalized = `${assetSymbolToProiderConvention(
      currencySymbol.symbol
    )}`;

    const exchangeRequests = exchangeList.map((exchangeListItem) => {
      const symbolCaseByExchange =
        exchangeListItem.api.priceBySymbol.case === 'upper'
          ? symbolNormalized.toUpperCase()
          : symbolNormalized.toLowerCase();

      /**
       * TODO: Should exclude requests to exchanges that do not have the selected asset pair.
       * This is "isSupported" property on exchange object.
       * Now it's just a waste of resources to make API calls.
      
       * if (
       *   exchangeListItem.isSupported ||
       *   exchangeListItem.isSupported === undefined
       * ) {
       *   return axiosInstance.get(
       *     `${exchangeListItem.api.url}${exchangeListItem.api.priceBySymbol.path}${symbolCaseByExchange}`
       *   );
       * }
       * */

      return axiosInstance.get(
        `${exchangeListItem.api.url}${exchangeListItem.api.priceBySymbol.path}${symbolCaseByExchange}`
      );
    });

    const assetPriceItems = [] as AssetListItem[];

    Promise.allSettled(exchangeRequests)
      .then((responses) => {
        responses.forEach((res: any, index) => {
          const price = res.value
            ? getObjectPropertyByIndex(
                res.value.data,
                exchangeList[index].api.priceBySymbol.properties.price
              )
            : null;
          const isAssetPairSupported = Boolean(price);

          dispatch(
            setIsSupported({ index, isSupported: isAssetPairSupported })
          );

          assetPriceItems.push({
            key: exchangeList[index].id,
            name: exchangeList[index].name,
            price: price,
            symbol: currencySymbol.symbol,
          });
        });

        dispatch(setAssetListItems(assetPriceItems));
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        dispatch(setIsLoading(false));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencySymbol.symbol, exchangeList]);

  const showModal = () => {
    dispatch(setIsModalOpen(true));
  };

  const handleCancel = () => {
    // Close the AssetsTradesList modal `details` and redirect to the default pair.
    dispatch(setIsModalOpen(false));
    const newUrl = paramsURL.pair || '/';
    navigate(newUrl, {
      replace: true,
    });
  };

  useEffect(() => {
    /**
     * If the asset pair is changed, the URL is updated and the price is requested.
     * The price is requested every DEFAULT_REQUEST_TIMEOUT ms.
     * The timer is cleared when the component is unmounted.
     *
     * TODO: Need to handle better setting default asset pair at app start.
     * Currently it's start with the default asset pair and then it's changed to the one selected by URL.
     * */

    if (exchangeList.length) {
      dispatch(setAssetListItems([]));

      const newUrlSymbol = assetPairSymbolToURL(currencySymbol.symbol);
      const newUrl = paramsURL.pair
        ? location.pathname.replace(paramsURL.pair, newUrlSymbol)
        : `${location.pathname}${'/'}${newUrlSymbol}`.replace(/\/\/+/g, '/'); // Replace double slashes with single slash.

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencySymbol.symbol, exchangeList]); // Probably exchangeList should be here as well

  const handleAssetPairsChange = (
    newCurrencySymbol: AssetPair,
    isExistingAssetPair: boolean
  ) => {};

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
      sorter: (a, b) => parseFloat(a.price) - parseFloat(b.price),
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
    /**
     *  If the exchange is changed in the URL and it is existing one, the modal is opened.
     * */
    const exchangeData = exchangeList.find(
      (exchangeItem) => exchangeItem?.name === paramsURL.exchange
    );

    if (exchangeData) {
      dispatch(setExchange(exchangeData));
      showModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsURL.exchange]);

  return (
    <div
      className={`asset-list grid grid-flow-row gap-2 items-end ${className}`}
    >
      <Modal
        title={`Trades List - ${exchange?.name}`}
        open={isModalOpen}
        onOk={handleCancel}
        onCancel={handleCancel}
      >
        {currencySymbol && exchange && <AssetTradesList />}
      </Modal>
      <ExchangeListSearch
        className="place-self-end"
        defaultCurrencySymbol={defaultCurrencySymbol}
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
