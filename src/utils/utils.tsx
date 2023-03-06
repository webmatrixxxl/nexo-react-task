import { AssetPair } from '../Components/AssetSearch/AssetSearch';

export const getObjectPropertyByIndex = (obj: any, path: string) => {
  try {
    return path
      .replace(/\[|\]\.?/g, '.')
      .split('.')
      .filter((s: any) => s)
      .reduce(
        (acc: any, val: any) => (acc && acc[val]) || acc[Object.keys(acc)[val]],
        obj
      );
  } catch (e) {
    return null;
  }
};

export const currencySymbolToAssetPair = (assetPair: string): AssetPair => {
  const pairs = assetPair.split('/');

  return {
    symbol: assetPair,
    baseAsset: pairs[0] && pairs[1] ? pairs[0].toUpperCase() : '',
    quoteAsset: pairs[0] && pairs[1] ? pairs[1].toUpperCase() : '',
  };
};

export const assetPairURLToSymbol = (assetPair: string): string => {
  const pair = assetPair.replace('_', '/');

  return pair;
};

export const assetPairSymbolToURL = (assetPair: string): string => {
  const pair = assetPair.replace('/', '_');

  return pair;
};

export const assetSymbolToProiderConvention = (assetPair: string): string => {
  const pair = assetPair.replaceAll(/\//gi, '');

  return pair;
};

export const replacePathVairables = (
  path: string,
  symbol: string,
  limit: number
) => {
  return path
    .replaceAll('{symbol}', symbol)
    .replaceAll('{limit}', limit.toString());
};
